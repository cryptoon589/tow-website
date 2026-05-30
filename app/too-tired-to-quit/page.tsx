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
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimRequest, setClaimRequest] = useState<any>(null);

  const displayName = useMemo(() => {
    const username = status?.xUsername ?? saved?.xUsername;

    return username
      ? `@${String(username).replace(/^@+/, "")}`
      : status?.walletAddress
      ? maskWallet(status.walletAddress)
      : "Survivor";
  }, [status, saved]);

  useEffect(() => {
    if (saved?.walletAddress && isValidXrplWallet(saved.walletAddress)) {
      setWallet(saved.walletAddress);
      loadStatus(saved.walletAddress);
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

    await loadStatus(wallet.trim());
  }

  async function requestClaimAuthorization() {
    if (!status?.walletAddress) return;

    setClaimLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tired-claim-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: status.walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not create claim request.");
      }

      setClaimRequest(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setClaimLoading(false);
    }
  }

  const holdDays = status?.holdDays ?? 0;
  const nextMilestone = getNextMilestone(holdDays);
  const daysLeft = nextMilestone ? nextMilestone.days - holdDays : 0;
  const isVerified = Boolean(status?.verified);
  const hasUnlockedReward = (status?.rewardBreakdown?.basePercent ?? 0) > 0;

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* existing content preserved */}

        {status ? (
          <section className="mt-8 space-y-5">
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

            {status.archives?.length ? (
              <div className="rounded-[32px] border-2 border-black bg-[#F8F8F8] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                  Survivor Archive
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  Previous Survivor Seasons
                </h3>

                <div className="mt-5 space-y-4">
                  {status.archives.map((archive: any, index: number) => (
                    <div
                      key={`${archive.archived_at}-${index}`}
                      className="rounded-2xl border-2 border-black bg-white p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xl font-black">
                            {archive.season_label}
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#555]">
                            Survived {archive.survived_days} days before ending streak.
                          </p>
                        </div>

                        <div className="rounded-xl border-2 border-black px-4 py-2 text-sm font-black uppercase tracking-[0.14em]">
                          {archive.reward_status === "paid"
                            ? "Reward Paid"
                            : archive.reward_status === "pending_manual_payout"
                            ? "Pending Payout"
                            : archive.reward_status}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <MiniStat
                          label="Committed"
                          value={`${formatTow(archive.total_tow_committed)} TOW`}
                        />

                        <MiniStat
                          label="Unlocked"
                          value={`${formatTow(archive.total_unlocked_tow)} TOW`}
                        />

                        <MiniStat
                          label="Archived"
                          value={new Date(archive.archived_at).toLocaleDateString()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
