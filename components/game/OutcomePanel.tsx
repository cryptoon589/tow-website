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

function face(kind: Outcome["kind"] | undefined) {
  if (kind === "win" || kind === "winSmall") return ":)";
  if (kind === "rekt") return "x_x";
  if (kind === "glitch") return "?!";
  return ":/";
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
          initial={{ opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
          className={`w-full rounded-[28px] border px-4 py-3 text-center shadow-sm ${tone(outcome.kind)}`}
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={outcome.kind === "rekt" ? { rotate: [-6, 6, -4, 4, 0] } : { y: [0, -2, 0] }}
              transition={{ duration: outcome.kind === "rekt" ? 0.28 : 1.4, repeat: outcome.kind === "rekt" ? 0 : Infinity }}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-current/20 bg-white/60 font-black"
            >
              {face(outcome.kind)}
            </motion.div>

            <div className="min-w-0 text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
                {gameOver ? "final hit" : outcome.delta < 0 && outcome.headline.includes("ALMOST") ? "clutch save" : "outcome"}
              </div>
              <div className="mt-0.5 text-xl font-black leading-tight">
                {outcome.headline || "Something happened"}
              </div>
              <div className="mt-0.5 text-sm font-medium opacity-80">
                {outcome.subtext || "The timeline reacted."}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-black shadow-sm">
              {deltaText(outcome.delta)}
            </div>
            {(outcome.currentWinStreak ?? 0) >= 2 && (
              <div className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] shadow-sm">
                heater x{outcome.currentWinStreak}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
