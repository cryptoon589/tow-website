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

export default function TooTiredToQuitPage() {
  const saved = getRewardProfile();

  const [wallet, setWallet] = useState(saved?.walletAddress ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");

    if (!isValidXrplWallet(wallet)) {
      setError("Enter a valid XRPL wallet.");
      return;
    }

    await loadStatus(wallet);
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
            Proof you endured. Hold through the exhaustion and build your tired history.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/too-tired-to-quit/leaderboard" className="rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              View Leaderboard
            </Link>

            <Link href="/play/start" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              Play TOW Game
            </Link>

            <Link href="/raid-board" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              Everyone’s Tired
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] border-2 border-black bg-white p-5">
          <div className="mb-4 rounded-2xl border-2 border-dashed border-black p-4 text-sm font-bold text-[#555]">
            Link your wallet once and keep building your tired history.
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              placeholder="Enter XRPL wallet"
              className="flex-1 rounded-2xl border-2 border-black px-4 py-3 font-bold outline-none focus:border-[#5B2BE8]"
            />

            <button onClick={checkStatus} disabled={loading} className="rounded-2xl border-2 border-black bg-black px-6 py-3 font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50">
              {loading ? "Checking..." : status ? "Refresh Status" : "Check Status"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm font-black text-[#B14A35]">{error}</p> : null}
        </section>

        {status ? (
          <section className="mt-8 space-y-5">
            <div className="rounded-[28px] border-2 border-black bg-black p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[#A78BFA]">
                    Current State
                  </p>

                  <h2 className="mt-2 text-4xl font-black">
                    {status.tiredLevel.emoji} {status.tiredLevel.label}
                  </h2>

                  <p className="mt-3 text-2xl font-black text-white">
                    STILL HERE: {status.holdDays} DAYS
                  </p>

                  <p className="mt-2 text-white/70">
                    {maskWallet(status.walletAddress)}
                  </p>
                </div>

                <div className="rounded-3xl border-2 border-white px-6 py-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                    Survival Score
                  </p>

                  <p className="mt-2 text-5xl font-black">
                    {status.activityScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card label="Active Commitments" value={status.alivePositions} />
              <Card label="Raid Posts" value={status.raidPosts} />
              <Card label="Game Runs" value={status.gameRuns} />
              <Card label="Best Score" value={status.gameBestScore} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card label="Committed" value={`${formatTow(status.totalTowAmount)} TOW`} />
              <Card label="Unlocked" value={`${formatTow(status.unlockedRewardTow)} TOW`} />
              <Card label="Remaining" value={`${formatTow(status.remainingRewardTow)} TOW`} />
            </div>

            <div className="rounded-[24px] border-2 border-black bg-[#F8F8F8] p-5 text-sm font-bold text-[#555]">
              Hold time and active commitments are permanent progression. Raids and game activity act as temporary weekly boosts and community participation signals.
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
