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
  if (days < 28) return { label: "4 Week Survivor", days: 28 };
  if (days < 56) return { label: "8 Week Survivor", days: 56 };
  if (days < 84) return { label: "12 Week Survivor", days: 84 };
  return null;
}

export default function TooTiredToQuitPage() {
  const saved = getRewardProfile();

  const [wallet, setWallet] = useState(saved?.walletAddress ?? "");
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");

  const displayName = useMemo(() => {
    const username = status?.xUsername ?? saved?.xUsername;

    return username
      ? `@${String(username).replace(/^@+/, "")}`
      : status?.walletAddress
      ? maskWallet(status.walletAddress)
      : "Survivor";
  }, [status, saved]);

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
      const response = await fetch(`/api/tired-status?wallet=${encodeURIComponent(targetWallet)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not load status");
      }

      setStatus(data);
      localStorage.setItem("tow_saved_wallet", targetWallet);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    if (!isValidXrplWallet(wallet)) {
      setError("Enter a valid XRPL wallet.");
      return;
    }

    await loadStatus(wallet);
  }

  const holdDays = status?.holdDays ?? 0;
  const nextMilestone = getNextMilestone(holdDays);
  const daysLeft = nextMilestone ? nextMilestone.days - holdDays : 0;
  const progress = Math.min(100, (holdDays / 84) * 100);

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <section>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#5B2BE8]">
            Proof Of Tiredness
          </p>

          <h1 className="mt-2 text-5xl font-black md:text-7xl">
            Too Tired To Quit
          </h1>

          <p className="mt-4 text-lg text-[#555]">
            Survive. Participate. Build your TOW history.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/too-tired-to-quit/leaderboard" className="rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white">
              View Leaderboard
            </Link>

            <Link href="/too-tired-to-quit/how-it-works" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black">
              FAQ / How It Works
            </Link>

            <Link href="/play/start" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black">
              Play TOW Game
            </Link>

            <Link href="/raid-board" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black">
              Everyone's Tired
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border-2 border-black p-5">
          <div className="mb-4 rounded-2xl border-2 border-dashed border-black p-4 text-sm font-bold text-[#555]">
            Your wallet becomes your survivor identity across TOW.
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter XRPL wallet"
              className="flex-1 rounded-2xl border-2 border-black px-4 py-3 font-bold outline-none"
            />

            <button
              onClick={checkStatus}
              disabled={loading}
              className="rounded-2xl border-2 border-black bg-black px-6 py-3 font-black text-white"
            >
              {loading ? "Checking..." : "Refresh Status"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm font-black text-red-600">{error}</p> : null}
        </section>

        {status ? (
          <section className="mt-8 space-y-5">
            <div className="rounded-[32px] border-2 border-black bg-black p-6 text-white">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[#A78BFA]">
                    Survivor Identity
                  </p>

                  <h2 className="mt-3 text-5xl font-black">
                    {status.tiredLevel?.emoji} {status.tiredLevel?.label}
                  </h2>

                  <p className="mt-4 text-3xl font-black">
                    {displayName}
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/55">
                    {maskWallet(status.walletAddress)}
                  </p>

                  <p className="mt-5 text-3xl font-black">
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
                    {nextMilestone
                      ? `${daysLeft} days until ${nextMilestone.label}`
                      : "Full 12-week survivor route reached"}
                  </h3>
                </div>

                <p className="text-base font-black uppercase tracking-[0.18em] text-[#5B2BE8]">
                  Current Base: {status.rewardBreakdown?.basePercent ?? 0}%
                </p>
              </div>

              <div className="mt-10 px-4">
                <div className="relative h-4 rounded-full border-2 border-black bg-white">
                  <div className="h-full rounded-full bg-black" style={{ width: `${progress}%` }} />

                  {[0, 28, 56, 84].map((day) => (
                    <div
                      key={day}
                      className={`absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-2 border-black ${holdDays >= day ? "bg-black" : "bg-white"}`}
                      style={{ left: `calc(${(day / 84) * 100}% - 18px)` }}
                    />
                  ))}
                </div>

                <div className="relative mt-8 h-20 font-black uppercase tracking-[0.12em] text-[#444]">
                  <div className="absolute left-0 -translate-x-1/2 text-center">
                    <div className="text-lg">0D</div>
                  </div>

                  <div className="absolute left-[33.333%] -translate-x-1/2 text-center">
                    <div className="text-xl">4W</div>
                    <div className="mt-1 text-lg text-black">2.5%</div>
                  </div>

                  <div className="absolute left-[66.666%] -translate-x-1/2 text-center">
                    <div className="text-xl">8W</div>
                    <div className="mt-1 text-lg text-black">7%</div>
                  </div>

                  <div className="absolute right-0 translate-x-1/2 text-center">
                    <div className="text-xl">12W</div>
                    <div className="mt-1 text-lg text-black">15%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MiniStat label="Active Commitments" value={status.alivePositions} />
              <MiniStat label="Raid Posts" value={status.raidPosts} />
              <MiniStat label="Game Runs" value={status.gameRuns} />
              <MiniStat label="Game Highscore" value={status.gameBestScore} />
            </div>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black"
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
