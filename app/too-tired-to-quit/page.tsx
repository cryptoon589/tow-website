"use client";

import { useState } from "react";
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

  async function checkStatus() {
    setError("");

    if (!isValidXrplWallet(wallet)) {
      setError("Enter a valid XRPL wallet.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/tired-status?wallet=${encodeURIComponent(wallet)}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not load status.");
      }

      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
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
            Hold through the exhaustion. Track your TOW commitment, activity,
            rewards, and how long you have managed to stay here.
          </p>
        </section>

        <section className="rounded-[28px] border-2 border-black bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              placeholder="Enter XRPL wallet"
              className="flex-1 rounded-2xl border-2 border-black px-4 py-3 font-bold outline-none focus:border-[#5B2BE8]"
            />

            <button
              onClick={checkStatus}
              disabled={loading}
              className="rounded-2xl border-2 border-black bg-black px-6 py-3 font-black text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </div>

          {error ? (
            <p className="mt-3 text-sm font-black text-[#B14A35]">{error}</p>
          ) : null}
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

                  <p className="mt-2 text-white/70">
                    {maskWallet(status.walletAddress)} • {status.holdDays} days still here
                  </p>
                </div>

                <div className="rounded-3xl border-2 border-white px-6 py-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
                    Activity Score
                  </p>

                  <p className="mt-2 text-5xl font-black">
                    {status.activityScore}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Card label="Still Here" value={status.alivePositions} />
              <Card label="Raid Posts" value={status.raidPosts} />
              <Card label="Game Runs" value={status.gameRuns} />
              <Card label="Best Score" value={status.gameBestScore} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card label="Committed" value={`${formatTow(status.totalTowAmount)} TOW`} />
              <Card label="Unlocked" value={`${formatTow(status.unlockedRewardTow)} TOW`} />
              <Card label="Remaining" value={`${formatTow(status.remainingRewardTow)} TOW`} />
            </div>

            <div className="rounded-[28px] border-2 border-black bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[#5B2BE8]">
                    Still Here
                  </p>

                  <h3 className="text-2xl font-black">
                    Commitments
                  </h3>
                </div>

                <div className="rounded-full border border-black px-3 py-1 text-xs font-black uppercase">
                  Selling Ends Eligibility
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {status.positions.length === 0 ? (
                  <p className="rounded-2xl border-2 border-dashed border-black p-4 text-sm font-bold text-[#555]">
                    No qualifying commitments found yet.
                  </p>
                ) : (
                  status.positions.map((position: any) => (
                    <div
                      key={position.id}
                      className="rounded-2xl border-2 border-black p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-black">
                            {formatTow(position.towAmount)} TOW
                          </p>

                          <p className="text-sm text-[#555]">
                            Max unlock: {formatTow(position.maxRewardTow)} TOW
                          </p>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                            position.status === "alive"
                              ? "bg-[#DDFBE8] text-[#146C36]"
                              : "bg-[#FFE8DF] text-[#B14A35]"
                          }`}
                        >
                          {position.status === "alive"
                            ? "Still Here"
                            : "Gave Up"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
