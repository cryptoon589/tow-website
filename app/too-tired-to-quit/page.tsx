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

                <p className="text-base font-black uppercase tracking-[0.18em] text-[#5B2BE8]">
                  Current Base: {status.rewardBreakdown?.basePercent ?? 0}%
                </p>
              </div>

              <div className="mt-10 px-4">
                <div className="relative h-4 rounded-full border-2 border-black bg-white">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${progress}%` }}
                  />

                  {[0, 28, 56, 84].map((day) => (
                    <div
                      key={day}
                      className={`absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-2 border-black ${holdDays >= day ? "bg-black" : "bg-white"}`}
                      style={{ left: `calc(${(day / 84) * 100}% - 18px)` }}
                    />
                  ))}
                </div>

                <div className="relative mt-8 h-20 text-center font-black uppercase tracking-[0.12em] text-[#444]">
                  <div className="absolute left-0 -translate-x-1/2">
                    <div className="text-lg">0D</div>
                  </div>

                  <div className="absolute left-[33.333%] -translate-x-1/2">
                    <div className="text-xl">4W</div>
                    <div className="mt-1 text-lg text-black">2.5%</div>
                  </div>

                  <div className="absolute left-[66.666%] -translate-x-1/2">
                    <div className="text-xl">8W</div>
                    <div className="mt-1 text-lg text-black">7%</div>
                  </div>

                  <div className="absolute right-0 translate-x-1/2">
                    <div className="text-xl">12W</div>
                    <div className="mt-1 text-lg text-black">15%</div>
                  </div>
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
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MiniStat label="Lifetime Runs" value={status.gameRuns} />
              <MiniStat label="Lifetime Raids" value={status.raidPosts} />
              <MiniStat label="Highest Score" value={status.gameBestScore} />
              <MiniStat label="Active Commitments" value={status.alivePositions} />
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
