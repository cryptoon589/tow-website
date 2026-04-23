"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Outcome } from "@/components/game/engine";

type OutcomePanelProps = {
  outcome: Outcome | null;
  visible: boolean;
  gameOver?: boolean;
};

export function OutcomePanel({
  outcome,
  visible,
  gameOver = false,
}: OutcomePanelProps) {
  const headline = gameOver
    ? outcome?.headline
    : outcome?.autoPicked
    ? "FATE CHOSE"
    : outcome?.headline;

  const subtext = gameOver
    ? outcome?.subtext
    : outcome?.autoPicked
    ? "You took too long. The timeline moved first."
    : outcome?.subtext;

  return (
    <div className="min-h-[140px]">
      <AnimatePresence mode="wait">
        {visible && outcome ? (
          <motion.div
            key={`${headline}-${outcome.delta}-${outcome.kind}`}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="bg-[#FFFCF8] border border-[#DDD7CE] rounded-2xl px-5 py-5 shadow-sm text-center"
          >
            {/* HEADLINE */}
            <div className="text-[clamp(1.6rem,4vw,2.4rem)] font-black text-[#1E1B18] tracking-tight">
              {headline}
            </div>

            {/* SUBTEXT */}
            <div className="mt-2 text-sm md:text-base text-[#6F685F]">
              {subtext}
            </div>

            {/* DELTA */}
            {!gameOver && (
              <div
                className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
                  outcome.delta <= 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {outcome.delta > 0 ? "+" : ""}
                {outcome.delta} tired
              </div>
            )}

            {/* MODIFIERS */}
            {outcome.appliedModifiers.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {outcome.appliedModifiers.map((mod) => (
                  <span
                    key={`${mod.kind}-${mod.turnsLeft}`}
                    className="rounded-full border border-[#DDD7CE] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6F685F]"
                  >
                    {mod.kind} · {mod.turnsLeft} turn
                    {mod.turnsLeft > 1 ? "s" : ""}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-[#6F685F]"
          >
            Choose before the market does.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OutcomePanel;