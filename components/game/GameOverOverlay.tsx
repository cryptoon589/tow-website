"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GameState, PlayerProfile } from "@/components/game/engine";
import { getGameOverHeadline, getGameOverSubtext, getPersonaLine, getRunTitle } from "@/components/game/engine";
import TowCharacter from "@/components/game/TowCharacter";

type Props = {
  state: GameState;
  bestRun: number;
  profile?: PlayerProfile;
  onReplay: () => void;
};

function buildShareText(state: GameState, bestRun: number, profile?: PlayerProfile) {
  const title = getRunTitle(state);
  return [
    `TOW RUN ID: ${title}`,
    `Lasted ${state.turn} turns. Best: ${bestRun}.`,
    `Final tired: ${state.tired}/100. Best heater: x${state.memory.bestWinStreak}.`,
    `Almost saves: ${state.memory.almostSaves}.`,
    profile ? `Player memory: ${profile.persona}.` : "Run it back?",
  ].join("\n");
}

export default function GameOverOverlay({ state, bestRun, profile, onReplay }: Props) {
  const open = state.gameOver;
  const runTitle = getRunTitle(state);
  const headline = getGameOverHeadline(state);
  const subtext = getGameOverSubtext(state);
  const runId = `RUN-${String(state.turn).padStart(4, "0")}-${String(state.memory.chaosPicks + state.memory.timeouts + state.memory.rektCount).padStart(2, "0")}`;
  const shareText = buildShareText(state, bestRun, profile);

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-3 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.94, rotate: -0.4 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-[820px] overflow-hidden rounded-[30px] border border-white/20 bg-[#FFFCF8] p-3 text-[#1E1B18] shadow-2xl"
          >
            {/* TOW Run ID card */}
            <div className="relative overflow-hidden rounded-[24px] border border-[#E8E1D7] bg-white p-4 shadow-sm md:p-5">
              <div className="pointer-events-none absolute inset-0 opacity-[0.055]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #000 0 1px, transparent 1px 10px)" }} />
              <div className="relative z-10 mb-3 flex items-center justify-between gap-3 border-b border-[#E8E1D7] pb-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.26em] text-[#8A8278]">TOW RUN ID</div>
                  <div className="font-mono text-xs font-black tracking-wide text-[#1E1B18]">{runId}</div>
                </div>
                <div className="rotate-[-2deg] rounded-full border border-red-200 bg-red-50 px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-red-500">
                  {headline}
                </div>
              </div>

              <div className="relative z-10 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
                <div className="relative mx-auto h-[185px] w-[210px] overflow-hidden rounded-[28px] border border-[#E8E1D7] bg-[#F7F2EA] shadow-inner md:mx-0">
                  <div className="absolute inset-x-0 top-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8278]">portrait</div>
                  <div className="absolute left-1/2 top-[18px] -translate-x-1/2 scale-[1.18]">
                    <TowCharacter state="react-rekt" width={185} height={185} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-[54px] bg-gradient-to-t from-[#F7F2EA] to-transparent" />
                </div>

                <div className="min-w-0">
                  <div className="text-4xl font-black leading-none tracking-tight md:text-5xl">{runTitle}</div>
                  <div className="mt-1 text-sm font-medium text-[#6F685F]">{subtext}</div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    <div className="rounded-2xl bg-[#F2EEE9] p-3">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8A8278]">turns</div>
                      <div className="text-xl font-black">{state.turn}</div>
                    </div>
                    <div className="rounded-2xl bg-[#F2EEE9] p-3">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8A8278]">tired</div>
                      <div className="text-xl font-black">{state.tired}/100</div>
                    </div>
                    <div className="rounded-2xl bg-[#F2EEE9] p-3">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8A8278]">heater</div>
                      <div className="text-xl font-black">x{state.memory.bestWinStreak}</div>
                    </div>
                    <div className="rounded-2xl bg-[#F2EEE9] p-3">
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8A8278]">saves</div>
                      <div className="text-xl font-black">{state.memory.almostSaves}</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-black/5 bg-[#F7F2EA] p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8278]">player memory</div>
                    <div className="mt-1 text-sm font-black lowercase text-[#2A2723]">{profile?.persona ?? "fresh"}</div>
                    <div className="mt-0.5 text-sm text-[#6F685F]">{profile ? getPersonaLine(profile.persona) : "the chart has not learned you yet"}</div>
                  </div>

                  <div className="mt-3 text-sm italic text-[#6F685F]">
                    {state.memory.almostSaves > 0
                      ? "I was one tap away. That is why I ran it back."
                      : "I almost made it. Next run might be the one."}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 md:grid-cols-[1.3fr_1fr_1fr]">
              <button onClick={onReplay} className="rounded-2xl bg-black px-4 py-3 text-sm font-black lowercase text-white transition active:scale-95">
                run it back
              </button>
              <button onClick={copyResult} className="rounded-2xl border border-[#DDD7CE] bg-white px-4 py-3 text-sm font-bold lowercase transition active:scale-95">
                copy result
              </button>
              <button onClick={shareToX} className="rounded-2xl border border-[#DDD7CE] bg-white px-4 py-3 text-sm font-bold lowercase transition active:scale-95">
                share to X
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
