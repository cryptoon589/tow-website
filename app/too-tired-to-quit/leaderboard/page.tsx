"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatTow, maskWallet } from "@/lib/towProof";

export default function TooTiredLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/tired-leaderboard", {
          cache: "no-store",
        });

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
            The holders who stayed tired the longest. Ranked by commitment,
            activity, raids, game participation, and overall survival.
          </p>
        </section>

        <div className="rounded-[28px] border-2 border-black bg-white p-5">
          {loading ? (
            <p className="text-lg font-black">Loading tired survivors...</p>
          ) : error ? (
            <p className="text-lg font-black text-[#B14A35]">{error}</p>
          ) : entries.length === 0 ? (
            <p className="text-lg font-black">No tired survivors found yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      Rank
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      Wallet
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      State
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      Still Here
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      Committed
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      Unlocked
                    </th>
                    <th className="px-3 py-4 text-xs font-black uppercase tracking-[0.22em]">
                      Score
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.walletAddress}
                      className="border-b border-black/10"
                    >
                      <td className="px-3 py-4 text-lg font-black">
                        #{entry.rank}
                      </td>

                      <td className="px-3 py-4 font-bold">
                        {maskWallet(entry.walletAddress)}
                      </td>

                      <td className="px-3 py-4 font-black">
                        {entry.tiredLevel.emoji} {entry.tiredLevel.label}
                      </td>

                      <td className="px-3 py-4 font-black">
                        {entry.alivePositions}
                      </td>

                      <td className="px-3 py-4 font-black">
                        {formatTow(entry.totalTowAmount)} TOW
                      </td>

                      <td className="px-3 py-4 font-black text-[#146C36]">
                        {formatTow(entry.unlockedRewardTow)} TOW
                      </td>

                      <td className="px-3 py-4 text-xl font-black">
                        {entry.activityScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
