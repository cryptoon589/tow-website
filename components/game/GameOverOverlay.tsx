"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GameState } from "@/components/game/engine";
import { getGameOverHeadline, getGameOverSubtext, getRunTitle } from "@/components/game/engine";

type Props = {
  state: GameState;
  bestRun: number;
  onReplay: () => void;
};

function buildShareText(state: GameState, bestRun: number) {
  const title = getRunTitle(state);
  return [
    `TOW run: ${title}`,
    `Lasted ${state.turn} turns. Best: ${bestRun}.`,
    `Final tired: ${state.tired}/100.`,
    "I almost made it.",
  ].join("\n");
}

export default function GameOverOverlay({ state, bestRun, onReplay }: Props) {
  const open = state.gameOver;
  const runTitle = getRunTitle(state);
  const headline = getGameOverHeadline(state);
  const subtext = getGameOverSubtext(state);

  const shareText = buildShareText(state, bestRun);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // clipboard can fail in some browser contexts; button still harmless
    }
  };

  const shareToX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94, rotate: -0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-[#FFFCF8] p-5 text-center shadow-2xl"
          >
            <div className="rounded-[26px] border border-[#E8E1D7] bg-white p-5 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-red-500">{headline}</div>
              <div className="mt-2 text-4xl font-black tracking-tight text-[#1E1B18]">{runTitle}</div>
              <div className="mt-2 text-sm text-[#6F685F]">{subtext}</div>

              <div className="my-5 rounded-3xl bg-[#F2EEE9] p-4 text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8278]">share card</div>
                <div className="mt-2 space-y-1 text-sm font-semibold text-[#2A2723]">
                  <div>I lasted <strong>{state.turn}</strong> turns.</div>
                  <div>Final tired: <strong>{state.tired}/100</strong>.</div>
                  <div>Best heater: <strong>x{state.memory.bestWinStreak}</strong>.</div>
                  <div>Result: <strong>{runTitle}</strong>.</div>
                </div>
                <div className="mt-3 text-sm italic text-[#6F685F]">I almost made it. Next run might be the one.</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#6F685F]">
                <div className="rounded-2xl bg-[#F7F2EA] p-3"><strong className="block text-lg text-[#1E1B18]">{state.memory.chaosPicks}</strong> chaos picks</div>
                <div className="rounded-2xl bg-[#F7F2EA] p-3"><strong className="block text-lg text-[#1E1B18]">{state.memory.rektCount}</strong> rekt hits</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <button onClick={onReplay} className="rounded-2xl bg-black px-4 py-3 text-sm font-black lowercase text-white transition active:scale-95">
                run it back
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={copyResult} className="rounded-2xl border border-[#DDD7CE] bg-white px-4 py-3 text-sm font-bold lowercase transition active:scale-95">
                  copy result
                </button>
                <button onClick={shareToX} className="rounded-2xl border border-[#DDD7CE] bg-white px-4 py-3 text-sm font-bold lowercase transition active:scale-95">
                  share to X
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
