"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  getGameOverHeadline,
  getGameOverSubtext,
} from "@/components/game/engine";

type Props = {
  state: any;
  bestRun: number;
  onReplay: () => void;
};

export default function GameOverOverlay({
  state,
  bestRun,
  onReplay,
}: Props) {
  if (!state.gameOver) return null;

  const headline = getGameOverHeadline(state);
  const subtext = getGameOverSubtext(state);

  const streak = state.memory?.winStreak ?? 0;
  const bestStreak = state.memory?.bestWinStreak ?? 0;

  const hadHeater = bestStreak >= 3;

  return (
    <AnimatePresence>
      <motion.div
        key="gameover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-[#FFFCF8] border border-[#DDD7CE] rounded-2xl px-8 py-7 w-[90%] max-w-md text-center shadow-xl"
        >
          {/* TITLE */}
          <div className="text-2xl font-bold text-[#1E1B18] mb-2">
            {headline}
          </div>

          {/* SUBTEXT */}
          <div className="text-sm text-[#6F685F] mb-4">
            {subtext}
          </div>

          {/* STREAK MESSAGE */}
          {hadHeater && (
            <div className="text-xs text-[#8A8278] mb-4">
              You had a heater going (x{bestStreak}).  
              It always ends like that.
            </div>
          )}

          {!hadHeater && (
            <div className="text-xs text-[#8A8278] mb-4">
              You never really got going.
            </div>
          )}

          {/* STATS */}
          <div className="flex justify-center gap-3 text-xs mb-6 flex-wrap">
            <div className="px-3 py-1 border rounded-full bg-white">
              Run: {state.turn}
            </div>
            <div className="px-3 py-1 border rounded-full bg-white">
              Best Run: {bestRun}
            </div>
            <div className="px-3 py-1 border rounded-full bg-white">
              Best Heat: {bestStreak}
            </div>
          </div>

          {/* BUTTON */}
          <button
            onClick={onReplay}
            className="w-full py-3 rounded-xl bg-black text-white font-semibold hover:opacity-90 transition"
          >
            run it back
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}