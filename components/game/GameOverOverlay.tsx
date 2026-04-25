"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GameState } from "@/components/game/engine";
import { getGameOverHeadline, getGameOverSubtext, getRunTitle } from "@/components/game/engine";
import TowCharacter from "@/components/game/TowCharacter";

type Props = {
  state: GameState;
  bestRun: number;
  onReplay: () => void;
};

function buildShareText(state: GameState, bestRun: number) {
  const title = getRunTitle(state);
  const nearMiss = state.memory.almostSaves > 0 ? `Almost saves: ${state.memory.almostSaves}.` : "I almost made it.";

  return [
    `TOW run: ${title}`,
    `Lasted ${state.turn} turns. Best: ${bestRun}.`,
    `Final tired: ${state.tired}/100. Best heater: x${state.memory.bestWinStreak}.`,
    nearMiss,
    "Run it back?",
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
      // harmless fallback
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94, rotate: -0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-[#FFFCF8] p-4 text-center shadow-2xl"
          >
            <div className="rounded-[26px] border border-[#E8E1D7] bg-white p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-red-500">{headline}</div>
              <div className="mt-1 text-4xl font-black tracking-tight text-[#1E1B18]">{runTitle}</div>
              <div className="mt-1 text-sm text-[#6F685F]">{subtext}</div>

              <div className="relative mx-auto -mb-2 -mt-1 h-[120px] w-[120px] overflow-hidden">
                <TowCharacter state="react-rekt" width={120} height={120} />
              </div>

              <div className="rounded-3xl bg-[#F2EEE9] p-4 text-left">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8278]">share card</div>
                <div className="mt-2 space-y-1 text-sm font-semibold text-[#2A2723]">
                  <div>I lasted <strong>{state.turn}</strong> turns.</div>
                  <div>Final tired: <strong>{state.tired}/100</strong>.</div>
                  <div>Best heater: <strong>x{state.memory.bestWinStreak}</strong>.</div>
                  <div>Almost saves: <strong>{state.memory.almostSaves}</strong>.</div>
                  <div>Result: <strong>{runTitle}</strong>.</div>
                </div>
                <div className="mt-3 text-sm italic text-[#6F685F]">
                  {state.memory.almostSaves > 0
                    ? "I was one tap away. That is why I ran it back."
                    : "I almost made it. Next run might be the one."}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[#6F685F]">
                <div className="rounded-2xl bg-[#F7F2EA] p-2"><strong className="block text-base text-[#1E1B18]">{state.memory.chaosPicks}</strong> chaos</div>
                <div className="rounded-2xl bg-[#F7F2EA] p-2"><strong className="block text-base text-[#1E1B18]">{state.memory.rektCount}</strong> rekt</div>
                <div className="rounded-2xl bg-[#F7F2EA] p-2"><strong className="block text-base text-[#1E1B18]">{state.memory.timeouts}</strong> auto</div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5">
              <button onClick={onReplay} className="rounded-2xl bg-black px-4 py-3 text-sm font-black lowercase text-white transition active:scale-95">
                run it back
              </button>
              <div className="grid grid-cols-2 gap-2.5">
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
