"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Outcome } from "@/components/game/engine";

type Props = {
  outcome: Outcome | null;
  visible: boolean;
  gameOver?: boolean;
};

function tone(kind: Outcome["kind"] | undefined) {
  if (kind === "win" || kind === "winSmall") return "text-emerald-600 border-emerald-200 bg-emerald-50";
  if (kind === "rekt") return "text-red-600 border-red-200 bg-red-50";
  if (kind === "glitch") return "text-violet-600 border-violet-200 bg-violet-50";
  return "text-amber-600 border-amber-200 bg-amber-50";
}

function deltaText(delta: number) {
  if (delta < 0) return `-${Math.abs(delta)} tired`;
  if (delta > 0) return `+${delta} tired`;
  return "no change";
}

export default function OutcomePanel({ outcome, visible, gameOver = false }: Props) {
  return (
    <AnimatePresence mode="wait">
      {outcome && visible && (
        <motion.div
          key={`${outcome.headline}-${outcome.delta}-${outcome.kind}`}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 360, damping: 25 }}
          className={`w-full rounded-3xl border px-4 py-3 text-center shadow-sm ${tone(outcome.kind)}`}
        >
          <div className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">
            {gameOver ? "final hit" : "outcome"}
          </div>

          <div className="mt-1 text-xl font-black leading-tight">
            {outcome.headline || "Something happened"}
          </div>

          <div className="mt-1 text-sm font-medium opacity-80">
            {outcome.subtext || "The timeline reacted."}
          </div>

          <div className="mt-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-black shadow-sm">
            {deltaText(outcome.delta)}
          </div>

          {(outcome.currentWinStreak ?? 0) >= 2 && (
            <div className="mt-2 text-[11px] font-black uppercase tracking-[0.14em]">
              heater x{outcome.currentWinStreak}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
