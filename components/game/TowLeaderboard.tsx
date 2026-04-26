"use client";

import { useEffect, useState } from "react";
import { getLeaderboard, TowLeaderboardEntry } from "@/lib/towLeaderboard";

export default function TowLeaderboard() {
  const [entries, setEntries] = useState<TowLeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  const topTen = entries.slice(0, 10);

  return (
    <section className="w-full rounded-[28px] border border-[#E5DED3] bg-[#FFFCF8]/90 p-4 shadow-[0_18px_60px_rgba(30,27,24,0.08)] backdrop-blur-xl">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B14A35]">
            Weekly Leaderboard
          </p>
          <h2 className="text-2xl font-black tracking-tight text-[#1E1B18]">
            Top 10 Reward Boost
          </h2>
        </div>

        <div className="rounded-full bg-[#1E1B18] px-3 py-1 text-xs font-black text-white">
          LIVE
        </div>
      </div>

      {topTen.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7CABC] bg-white/70 p-5 text-center">
          <p className="text-sm font-bold text-[#1E1B18]">
            No reward runs yet.
          </p>
          <p className="mt-1 text-sm text-[#6F665D]">
            Be first on the board before the trenches wake up.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topTen.map((entry, index) => (
            <div
              key={entry.id}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-[#EFE7DC] bg-white/78 px-3 py-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E1B18] text-sm font-black text-white">
                #{index + 1}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#1E1B18]">
                  @{entry.xUsername}
                </p>
                <p className="text-xs font-bold text-[#81766B]">
                  {entry.runs} run{entry.runs === 1 ? "" : "s"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-black text-[#B14A35]">
                  {entry.bestScore}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#81766B]">
                  Best
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-xs font-bold text-[#81766B]">
        Weekly Top 10 get reward boost eligibility.
      </p>
    </section>
  );
}