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

      setSuccess(`Claim submitted. ${data.claimedCommitments} commitment(s) awaiting distribution.`);

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

        <section className="rounded-[28px] border-2 border-black bg-white p-5">
          <div className="mb-4 rounded-2xl border-2 border-dashed border-black p-4 text-sm font-bold text-[#555]">
            Your wallet becomes your survivor identity across TOW.
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
          {success ? <p className="mt-3 text-sm font-black text-[#2E8B57]">{success}</p> : null}
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
                    {status.tiredLevel?.emoji} {status.tiredLevel?.label}
                  </h2>

                  <p className="mt-3 text-2xl font-black text-white">
                    STILL HERE: {status.holdDays} DAYS
                  </p>

                  <p className="mt-2 text-xl font-black text-white">
                    {status.xUsername ? `@${status.xUsername}` : maskWallet(status.walletAddress)}
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

            <div className="rounded-[28px] border-2 border-black bg-[#F8F8F8] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                Survival Progression
              </p>

              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <Milestone title="4 Weeks" reward="2.5%" reached={status.holdDays >= 28} active={status.holdDays >= 28 && status.holdDays < 56} />
                <Milestone title="8 Weeks" reward="7%" reached={status.holdDays >= 56} active={status.holdDays >= 56 && status.holdDays < 84} />
                <Milestone title="12 Weeks" reward="15%" reached={status.holdDays >= 84} active={status.holdDays >= 84} />
              </div>

              <div className="mt-5 rounded-3xl border-2 border-black bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                  Commitment Decision
                </p>

                <p className="mt-3 text-2xl font-black">
                  {status.rewardBreakdown?.basePercent > 0
                    ? `Current Unlock: ${status.rewardBreakdown.basePercent}%`
                    : "No survival milestone reached yet"}
                </p>

                <p className="mt-3 text-sm font-bold text-[#555]">
                  {status.holdDays >= 84
                    ? "You reached the highest survival tier. Ending this streak now will reset this commitment."
                    : status.holdDays >= 56
                    ? "You can continue surviving toward the 12-week survivor tier."
                    : status.holdDays >= 28
                    ? "You can continue surviving toward the 8-week survivor tier."
                    : "Keep surviving to reach your first milestone."}
                </p>

                {status.rewardBreakdown?.basePercent > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={claimCommitment}
                      disabled={claiming}
                      className="rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {claiming ? "Submitting Claim..." : "Claim & End Streak"}
                    </button>

                    <div className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black">
                      Continue Surviving
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card label="Active Commitments" value={status.alivePositions} />
              <Card label="Lifetime Raids" value={status.raidPosts} />
              <Card label="Lifetime Runs" value={status.gameRuns} />
              <Card label="Highest Score" value={status.gameBestScore} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card label="Committed" value={`${formatTow(status.totalTowAmount)} TOW`} />
              <Card label="Unlocked" value={`${formatTow(status.unlockedRewardTow)} TOW`} />
              <Card label="Remaining" value={`${formatTow(status.remainingRewardTow)} TOW`} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card label="Base Survival" value={`${status.rewardBreakdown?.basePercent ?? 0}%`} />
              <Card label="Recent Activity" value={`+${status.rewardBreakdown?.recentActivityPercent ?? 0}%`} />
              <Card label="History Bonus" value={`+${status.rewardBreakdown?.historyPercent ?? 0}%`} />
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
