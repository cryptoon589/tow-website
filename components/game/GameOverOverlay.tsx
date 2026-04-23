"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@/components/game/engine";
import {
  getGameOverHeadline,
  getGameOverSubtext,
  getRunTitle,
} from "@/components/game/engine";

type GameOverOverlayProps = {
  state: GameState;
  bestRun: number;
  onReplay: () => void;
};

export function GameOverOverlay({
  state,
  bestRun,
  onReplay,
}: GameOverOverlayProps) {
  if (!state.gameOver) return null;

  const headline = getGameOverHeadline(state);
  const subtext = getGameOverSubtext(state);
  const runTitle = getRunTitle(state);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-[#FFFCF8] border border-[#DDD7CE] rounded-2xl px-6 py-7 shadow-lg text-center max-w-md w-full mx-4"
        >
          <div className="text-[clamp(1.8rem,5vw,2.6rem)] font-black text-[#1E1B18] tracking-tight">
            {headline}
          </div>

          <div className="mt-2 text-sm md:text-base text-[#6F685F]">
            {subtext}
          </div>

          <div className="mt-4 text-xs uppercase tracking-wider text-[#8A8278]">
            {runTitle}
          </div>

          <div className="mt-5 flex justify-center gap-3 text-sm">
            <div className="px-3 py-2 rounded-xl border border-[#DDD7CE] bg-white">
              <div className="text-[#8A8278] text-xs">Turns</div>
              <div className="font-bold text-[#1E1B18]">{state.turn}</div>
            </div>

            <div className="px-3 py-2 rounded-xl border border-[#DDD7CE] bg-white">
              <div className="text-[#8A8278] text-xs">Best</div>
              <div className="font-bold text-[#1E1B18]">{bestRun}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={onReplay}
              className="rounded-xl bg-[#1E1B18] text-white py-3 font-semibold text-sm hover:opacity-90 transition"
            >
              Run it back
            </button>

            <Link
              href="/"
              className="rounded-xl border border-[#DDD7CE] py-3 text-sm font-semibold text-[#1E1B18] bg-white hover:bg-[#F7F5F2] transition text-center"
            >
              Exit
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GameOverOverlay;