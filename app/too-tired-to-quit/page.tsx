"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getRewardProfile, isValidXrplWallet } from "@/lib/towLeaderboard";
import { formatTow, maskWallet } from "@/lib/towProof";

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[22px] border-2 border-black bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#666]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function getNextMilestone(days: number) {
  if (days < 28) return { label: "4 Week Survivor", days: 28, reward: "2.5%" };
  if (days < 56) return { label: "8 Week Survivor", days: 56, reward: "7%" };
  if (days < 84) return { label: "12 Week Survivor", days: 84, reward: "15%" };
  return null;
}

function getProgressPercent(days: number) {
  return Math.min(100, Math.max(0, (days / 84) * 100));
}

export default function TooTiredToQuitPage() {
  const saved = getRewardProfile();

  const [wallet, setWallet] = useState(saved?.walletAddress ?? "");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState<any>(null);

  const displayName = useMemo(() => {
    const username = status?.xUsername ?? saved?.xUsername;
    return username ? `@${String(username).replace(/^@+/, "")}` : status?.walletAddress ? maskWallet(status.walletAddress) : "Survivor";
  }, [status?.xUsername, status?.walletAddress, saved?.xUsername]);

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
      "Ending this survival streak will submit your claim and reset active commitment progression. Continue?"
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
        throw new Error(data?.error ?? "Could not submit claim.");
      }

      setSuccess(`Claim submitted. ${data.claimedCommitments} commitment(s) awaiting distribution.`);
      await loadStatus(wallet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setClaiming(false);
    }
  }

  const holdDays = status?.holdDays ?? 0;
  const progress = getProgressPercent(holdDays);
  const nextMilestone = getNextMilestone(holdDays);
  const daysLeft = nextMilestone ? Math.max(0, nextMilestone.days - holdDays) : 0;

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
            Enter your wallet to load your survivor identity.
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
            <div className="rounded-[32px] border-2 border-black bg-black p-6 text-white">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[#A78BFA]">
                    Survivor Identity
                  </p>

                  <h2 className="mt-3 text-5xl font-black leading-tight">
                    {status.tiredLevel?.emoji} {status.tiredLevel?.label}
                  </h2>

                  <p className="mt-4 text-3xl font-black text-white">
                    {displayName}
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/55">
                    {maskWallet(status.walletAddress)}
                  </p>

                  <p className="mt-5 text-3xl font-black text-white">
                    STILL HERE: {holdDays} DAYS
                  </p>
                </div>

                <div className="rounded-3xl border-2 border-white px-6 py-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                    Survival Score
                  </p>

                  <p className="mt-2 text-6xl font-black">
                    {status.activityScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border-2 border-black bg-[#F8F8F8] p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                    Survival Route
                  </p>

                  <h3 className="mt-2 text-3xl font-black">
                    {nextMilestone ? `${daysLeft} days until ${nextMilestone.label}` : "Full 12-week survivor route reached"}
                  </h3>
                </div>

                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5B2BE8]">
                  Current Base: {status.rewardBreakdown?.basePercent ?? 0}%
                </p>
              </div>

              <div className="mt-8">
                <div className="relative h-4 rounded-full border-2 border-black bg-white">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${progress}%` }}
                  />

                  {[28, 56, 84].map((day) => (
                    <div
                      key={day}
                      className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-2 border-black ${holdDays >= day ? "bg-black" : "bg-white"}`}
                      style={{ left: `calc(${(day / 84) * 100}% - 16px)` }}
                    />
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-4 text-center text-xs font-black uppercase tracking-[0.16em] text-[#555]">
                  <div>0d</div>
                  <div>4w<br /><span className="text-black">2.5%</span></div>
                  <div>8w<br /><span className="text-black">7%</span></div>
                  <div>12w<br /><span className="text-black">15%</span></div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border-2 border-black bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                  Commitment Decision
                </p>

                <p className="mt-3 text-2xl font-black">
                  {status.rewardBreakdown?.basePercent > 0
                    ? `You can claim ${status.rewardBreakdown.basePercent}% base now, or keep surviving.`
                    : "No survival milestone reached yet."}
                </p>

                <p className="mt-3 text-sm font-bold text-[#555]">
                  {status.holdDays >= 84
                    ? "You reached the highest survival tier. Claiming ends this active streak."
                    : status.holdDays >= 56
                    ? "You can continue toward the 12-week survivor tier."
                    : status.holdDays >= 28
                    ? "You can continue toward the 8-week survivor tier."
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
              <MiniStat label="Lifetime Runs" value={status.gameRuns} />
              <MiniStat label="Lifetime Raids" value={status.raidPosts} />
              <MiniStat label="Highest Score" value={status.gameBestScore} />
              <MiniStat label="Active Commitments" value={status.alivePositions} />
            </div>

            <button
              onClick={() => setShowDetails((value) => !value)}
              className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
            >
              {showDetails ? "Hide Detailed Breakdown" : "View Detailed Breakdown"}
            </button>

            {showDetails ? (
              <div className="grid gap-4 md:grid-cols-3">
                <MiniStat label="Committed" value={`${formatTow(status.totalTowAmount)} TOW`} />
                <MiniStat label="Unlocked" value={`${formatTow(status.unlockedRewardTow)} TOW`} />
                <MiniStat label="Remaining" value={`${formatTow(status.remainingRewardTow)} TOW`} />
                <MiniStat label="Base Survival" value={`${status.rewardBreakdown?.basePercent ?? 0}%`} />
                <MiniStat label="Recent Activity" value={`+${status.rewardBreakdown?.recentActivityPercent ?? 0}%`} />
                <MiniStat label="History Bonus" value={`+${status.rewardBreakdown?.historyPercent ?? 0}%`} />
              </div>
            ) : null}
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
