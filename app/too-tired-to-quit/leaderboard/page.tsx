"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatTow, maskWallet } from "@/lib/towProof";

function SurvivorCard({ entry }: { entry: any }) {
  return (
    <div className="rounded-[28px] border-2 border-black bg-white p-5 transition hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#5B2BE8]">
            Rank #{entry.rank}
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {entry.xUsername ? `@${entry.xUsername}` : maskWallet(entry.walletAddress)}
          </h2>

          <p className="mt-1 text-sm font-bold text-[#777]">
            {maskWallet(entry.walletAddress)}
          </p>
        </div>

        <div className="rounded-3xl border-2 border-black bg-black px-4 py-3 text-center text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
            Score
          </p>

          <p className="mt-1 text-3xl font-black">
            {entry.survivalScore ?? entry.activityScore}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border-2 border-black bg-[#F8F8F8] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#666]">
              Current State
            </p>

            <p className="mt-2 text-2xl font-black">
              {entry.tiredLevel.emoji} {entry.tiredLevel.label}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#666]">
              Still Here
            </p>

            <p className="mt-2 text-3xl font-black">
              {entry.holdDays}d
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-black p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#666]">
            Commitments
          </p>

          <p className="mt-2 text-2xl font-black">
            {entry.alivePositions}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-black p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#666]">
            Committed
          </p>

          <p className="mt-2 text-2xl font-black">
            {formatTow(entry.totalTowAmount)}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-black bg-black p-4 text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
            Survival Unlock
          </p>

          <p className="mt-2 text-2xl font-black text-[#7DFF9B]">
            {formatTow(entry.unlockedRewardTow)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <div className="rounded-full border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-[0.15em]">
          {entry.gameRuns} Runs
        </div>

        <div className="rounded-full border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-[0.15em]">
          {entry.raidPosts} Raids
        </div>

        <div className="rounded-full border-2 border-black px-3 py-2 text-xs font-black uppercase tracking-[0.15em]">
          Best {entry.gameBestScore}
        </div>
      </div>
    </div>
  );
}

export default function TooTiredLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/tired-leaderboard", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Could not load leaderboard.");
        }

        setEntries(data.entries ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error.");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#5B2BE8]">
            Proof Of Tiredness
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Too Tired To Quit
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-[#555]">
            All-time survivor rankings built from endurance, participation, and TOW history.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/too-tired-to-quit" className="rounded-2xl border-2 border-black bg-black px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              Check Status
            </Link>

            <Link href="/too-tired-to-quit/how-it-works" className="rounded-2xl border-2 border-black px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              How It Works
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[28px] border-2 border-black bg-white p-6">
            <p className="text-lg font-black">Loading tired survivors...</p>
          </div>
        ) : error ? (
          <div className="rounded-[28px] border-2 border-black bg-white p-6">
            <p className="text-lg font-black text-[#B14A35]">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-[28px] border-2 border-black bg-white p-6">
            <p className="text-lg font-black">No tired survivors found yet.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {entries.map((entry) => (
              <SurvivorCard key={entry.walletAddress} entry={entry} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
