"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRewardProfile, isValidXrplWallet } from "@/lib/towLeaderboard";
import { formatTow, maskWallet } from "@/lib/towProof";

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border-2 border-black bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Milestone({ active, reached, title, reward }: { active?: boolean; reached?: boolean; title: string; reward: string }) {
  return (
    <div
      className={`flex-1 rounded-3xl border-2 p-4 text-center transition ${
        active
          ? "border-[#5B2BE8] bg-[#EFE9FF]"
          : reached
          ? "border-black bg-black text-white"
          : "border-black bg-white"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em]">{title}</p>
      <p className="mt-2 text-3xl font-black">{reward}</p>
    </div>
  );
}

export default function TooTiredToQuitPage() {
  const saved = getRewardProfile();

  const [wallet, setWallet] = useState(saved?.walletAddress ?? "");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("tow_saved_wallet");

    if (storedWallet && isValidXrplWallet(storedWallet)) {
      setWallet(storedWallet);
      loadStatus(storedWallet);
    }
  }, []);

  async function loadStatus(targetWallet: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/tired-status?wallet=${encodeURIComponent(targetWallet)}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not load status.");
      }

      setStatus(data);
      localStorage.setItem("tow_saved_wallet", targetWallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    setSuccess("");
    setError("");

    if (!isValidXrplWallet(wallet)) {
      setError("Enter a valid XRPL wallet.");
      return;
    }

    await loadStatus(wallet);
  }

  async function claimCommitment() {
    if (!status || claiming) return;

    const confirmed = window.confirm(
      "Ending this survival streak will reset your active commitment progression. Continue?"
    );

    if (!confirmed) return;

    setClaiming(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/tired-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not claim commitment.");
      }

      setSuccess(`Claimed ${data.claimedCommitments} commitment(s). Survival streak reset.`);

      await loadStatus(wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#5B2BE8]">
            Proof Of Tiredness
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Too Tired To Quit
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-[#555]">
            Survive. Participate. Build your TOW history.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/too-tired-to-quit/leaderboard" className="rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              View Leaderboard
            </Link>

            <Link href="/too-tired-to-quit/how-it-works" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              How It Works
            </Link>

            <Link href="/play/start" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              Play TOW Game
            </Link>

            <Link href="/raid-board" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              Everyone’s Tired
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
