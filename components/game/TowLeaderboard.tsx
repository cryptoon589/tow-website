"use client";

import { useEffect, useRef, useState } from "react";
import { TowLeaderboardEntry, getLeaderboard } from "@/lib/towLeaderboard";

function maskWallet(wallet: string) {
  if (!wallet) return "";
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export default function TowLeaderboard() {
  const [entries, setEntries] = useState<TowLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const previousRanks = useRef<Record<string, number>>({});

  async function refreshLeaderboard() {
    const nextEntries = await getLeaderboard();
    const nextRanks: Record<string, number> = {};

    nextEntries.forEach((entry, index) => {
      nextRanks[entry.walletAddress] = index + 1;
      const previous = previousRanks.current[entry.walletAddress];

      if (previous && previous !== index + 1) {
        setPulseId(entry.walletAddress);
        window.setTimeout(() => setPulseId(null), 900);
      }
    });

    previousRanks.current = nextRanks;
    setEntries(nextEntries);
    setLoading(false);
  }

  useEffect(() => {
    refreshLeaderboard();

    const interval = window.setInterval(refreshLeaderboard, 8000);

    function handleUpdate() {
      refreshLeaderboard();
    }

    window.addEventListener("tow-leaderboard-update", handleUpdate);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("tow-leaderboard-update", handleUpdate);
    };
  }, []);

  const topTen = entries.slice(0, 10);

  return (
    <section className="w-full rounded-[28px] border-2 border-black bg-white p-4 shadow-[8px_8px_0_#111]">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B14A35]">
            Weekly Leaderboard
          </p>
          <h2 className="text-2xl font-black tracking-tight text-black">
            Top 10 Reward Boost
          </h2>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-black text-white">
          <span className="h-2 w-2 animate-ping rounded-full bg-[#7CFF8A]" />
          LIVE
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border-2 border-dashed border-black bg-white p-5 text-center">
          <p className="animate-pulse text-sm font-black text-black">
            Loading trenches...
          </p>
        </div>
      ) : topTen.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black bg-white p-5 text-center">
          <p className="text-sm font-black text-black">No reward runs yet.</p>
          <p className="mt-1 text-sm font-bold text-[#555]">
            Be first on the board before the trenches wake up.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topTen.map((entry, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            const isMoving = pulseId === entry.walletAddress;

            return (
              <div
                key={entry.id}
                className={[
                  "grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-2xl border-2 border-black bg-white px-3 py-2 transition-all duration-500",
                  "hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111]",
                  isMoving ? "scale-[1.025] shadow-[0_0_26px_rgba(177,74,53,0.4)]" : "",
                  isTopThree ? "shadow-[0_0_18px_rgba(177,74,53,0.18)]" : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black",
                    rank === 1
                      ? "bg-[#B14A35] text-white animate-pulse"
                      : "bg-black text-white",
                  ].join(" ")}
                >
                  #{rank}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-black">
                      @{entry.xUsername}
                    </p>

                    {rank === 1 ? (
                      <span className="rounded-full bg-[#B14A35] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        King Tired
                      </span>
                    ) : null}

                    {rank <= 10 ? (
                      <span className="rounded-full border border-black px-2 py-0.5 text-[10px] font-black uppercase text-black">
                        Boost
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-0.5 text-xs font-bold text-[#555]">
                    {entry.runs} run{entry.runs === 1 ? "" : "s"} •{" "}
                    {maskWallet(entry.walletAddress)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-black text-[#B14A35] tabular-nums">
                    {entry.bestScore}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#555]">
                    Best
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 rounded-2xl border-2 border-black bg-black px-3 py-2 text-center text-xs font-black text-white">
        Weekly Top 10 get reward boost eligibility.
      </div>
    </section>
  );
}