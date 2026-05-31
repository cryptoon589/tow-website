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
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#666]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

const MILESTONES = [
  { label: "START", title: "Day 0", days: 0 },
  { label: "4W", title: "Still Here", days: 28 },
  { label: "8W", title: "Burnt Out", days: 56 },
  { label: "12W", title: "Fully Exhausted", days: 84 },
];

function MilestoneTracker({ days }: { days: number }) {
  const maxDays = 84;

  const progress = Math.min(
    100,
    (Math.max(0, days) / maxDays) * 100
  );

  return (
    <div className="mt-8">
      <div className="relative px-[5%] pb-2">

        {/* TRACK */}
        <div className="absolute left-[5%] right-[5%] top-4 h-[6px] rounded-full border-2 border-black bg-white" />

        {/* FILLED */}
        <div
          className="absolute left-[5%] top-4 h-[6px] rounded-full bg-black transition-all duration-700"
          style={{
            width: `calc(${progress}% * 0.9)`,
          }}
        />

        <div className="relative flex justify-between">
          {MILESTONES.map((milestone) => {
            const reached = days >= milestone.days;

            return (
              <div
                key={milestone.days}
                className="flex flex-col items-center"
              >
                <div
                  className={`h-8 w-8 rounded-full border-4 ${
                    reached
                      ? "border-black bg-black"
                      : "border-black bg-white"
                  }`}
                />

                <p className="mt-4 text-xl font-black">
                  {milestone.label}
                </p>

                <p className="mt-1 text-sm font-bold text-[#555] text-center">
                  {milestone.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
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
  const [claimingId, setClaimingId] = useState(false);
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
    const stored = localStorage.getItem("tow_reward_profile");

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);

      if (parsed?.walletAddress && isValidXrplWallet(parsed.walletAddress)) {
        setWallet(parsed.walletAddress);
        loadStatus(parsed.walletAddress);
      }
    } catch {}
  }, []);

  async function loadStatus(targetWallet: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tired-status?wallet=${encodeURIComponent(targetWallet)}`
      );
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

  async function requestClaimAuthorization(
  positionId: string
) {
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
  positionId,
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
            <Link
              href="/too-tired-to-quit/leaderboard"
              className="rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white"
            >
              View Leaderboard
            </Link>

            <Link
              href="/too-tired-to-quit/how-it-works"
              className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black"
            >
              FAQ / How It Works
            </Link>

            <Link
              href="/raid-board"
              className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black"
            >
              Everyone&apos;s Tired
            </Link>

            <Link
              href="/play/start"
              className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black"
            >
              Play TOW Game
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border-2 border-black p-5">
          <div className="mb-4 rounded-2xl border-2 border-dashed border-black p-4 text-sm font-bold text-[#555]">
            Your survivor identity follows you across raid posts, TOW game, and Proof Of Tiredness.
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

          {error ? (
            <p className="mt-3 text-sm font-black text-red-600">{error}</p>
          ) : null}
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

                  <p className="mt-4 text-3xl font-black">{displayName}</p>

                  <p className="mt-1 text-sm font-bold text-white/55">
                    {maskWallet(status.walletAddress)}
                  </p>

                  <p className="mt-4 inline-flex rounded-full border-2 border-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
                    {isVerified ? "Verified Survivor" : "Unverified Survivor"}
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

            {!isVerified ? (
              <div className="rounded-[28px] border-2 border-black bg-[#FFF4CC] p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8A5A00]">
                  Verification Required
                </p>

                <p className="mt-3 text-xl font-black">
                  This wallet can be viewed, but it will not rank or become claim-eligible until the survivor identity is verified.
                </p>

                <Link
                  href="/register"
                  className="mt-4 inline-flex rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white"
                >
                  Register / Verify Identity
                </Link>
              </div>
            ) : null}

            <div className="rounded-[32px] border-2 border-black bg-[#F8F8F8] p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                Survival Route
              </p>

              <h3 className="mt-2 text-3xl font-black">
  {holdDays === 0
    ? "Begin your survivor route"
    : nextMilestone
    ? `${daysLeft} days until ${nextMilestone.label}`
    : "Full 12-week survivor route reached"}
</h3>

              <MilestoneTracker days={status?.holdDays ?? 0} />
            </div>

            <div className="space-y-4">
 {status.activeCommitments?.map(
  (commitment: any, index: number) => {
    const claimable = commitment.holdDays >= 28;

    return (
      <div
        key={commitment.id}
        className="rounded-3xl border-2 border-black bg-white p-5"
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
          Commitment #{index + 1}
        </p>

        <h3 className="mt-2 text-3xl font-black">
          {commitment.tiredLevel?.emoji}
          {" "}
          {commitment.tiredLevel?.label}
        </h3>

        <p className="mt-2 text-xl font-black">
          {commitment.holdDays} Days
        </p>

        <p className="mt-2 text-sm font-bold text-[#555]">
          {formatTow(commitment.towAmount)} TOW
        </p>

        <button
  onClick={() =>
    requestClaimAuthorization(
      commitment.id
    )
  }
  disabled={!claimable}
  className={`mt-4 rounded-2xl border-2 px-5 py-3 text-sm font-black ${
    claimable
      ? "border-black bg-black text-white"
      : "cursor-not-allowed border-black bg-[#E5E5E5] text-[#777]"
  }`}
>
  {claimable
    ? "Claim This Commitment"
    : "Locked Until 4 Weeks"}
</button>
      </div>
      );
  })}
</div>

              {claimRequest ? (
                <div className="mt-5 rounded-2xl border-2 border-dashed border-black bg-[#F8F8F8] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#666]">
                    Claim Authorization Code
                  </p>

<p className="mt-3 text-3xl font-black tracking-[0.12em]">
  {claimRequest.claimCode}
</p>

<p className="mt-3 text-sm font-bold text-[#555]">
  {claimRequest.instructions}
</p>

<p className="mt-4 text-xs font-bold text-[#555]">
  Each commitment can be claimed independently after reaching 4 weeks. Continuing beyond each milestone increases the unlocked reward.
</p>

                  <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[#5B2BE8]">
                    Expires: {new Date(claimRequest.expiresAt).toLocaleString()}
                  </p>

                  {claimRequest.reused ? (
                    <p className="mt-2 text-xs font-black text-[#8A5A00]">
                      Existing pending authorization reused.
                    </p>
                  ) : null}
                </div>
              ) : null}
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
                <MiniStat
                  label="Committed"
                  value={`${formatTow(status.totalTowAmount)} TOW`}
                />

                <MiniStat
                  label="Unlocked"
                  value={`${formatTow(status.unlockedRewardTow)} TOW`}
                />

                <MiniStat
                  label="Remaining"
                  value={`${formatTow(status.remainingRewardTow)} TOW`}
                />

               <MiniStat
                 label="Recent Activity"
                 value={`+${
                 status.rewardBreakdown?.recentActivityPercent ?? 0
               }%`}
               />

                <MiniStat
                  label="Raid Bonus"
                  value={`+${status.rewardBreakdown?.raidBonusPercent ?? 0}%`}
                />

                <MiniStat
                  label="Game Bonus"
                  value={`+${status.rewardBreakdown?.gameBonusPercent ?? 0}%`}
                />

                <MiniStat
                  label="Loyalty Bonus"
                  value={`+${
                    status.rewardBreakdown?.loyaltyBonusPercent ??
                    status.rewardBreakdown?.historyPercent ??
                    0
                  }%`}
                />
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
