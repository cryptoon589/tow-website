"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GameState } from "@/components/game/engine";

type Props = {
  state: GameState;
  timeLeftMs: number;
  choiceWindowMs: number;
};

export default function SceneLayer({ state, timeLeftMs, choiceWindowMs }: Props) {
  const urgency = choiceWindowMs > 0 ? 1 - timeLeftMs / choiceWindowMs : 0;
  const tiredPct = Math.min(1, state.tired / 100);
  const kind = state.lastOutcome?.kind;
  const flashKey = state.lastOutcome ? `${state.turn}-${state.lastOutcome.headline}-${state.lastOutcome.delta}` : "none";

  const isBad = ["lose", "loseSmall", "rekt"].includes(kind || "");
  const isGood = ["win", "winSmall"].includes(kind || "");
  const isGlitch = kind === "glitch";
  const outcomeActive = state.phase === "resolving" || state.phase === "gameOver";

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F7F2EA]">
      <motion.div
        className="absolute inset-0"
        animate={{
          background:
            tiredPct > 0.78
              ? "radial-gradient(circle at 50% 30%, #FFF7ED 0%, #FEE2E2 48%, #F7F2EA 100%)"
              : tiredPct > 0.48
              ? "radial-gradient(circle at 50% 30%, #FFFBEB 0%, #F7F2EA 58%, #EFE7DD 100%)"
              : "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F7F2EA 60%, #EFE7DD 100%)",
        }}
        transition={{ duration: 0.35 }}
      />

      <motion.div
        className="absolute left-1/2 top-[44%] h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-3xl"
        animate={{ scale: 1 + tiredPct * 0.14 + urgency * 0.05, opacity: 0.48 - tiredPct * 0.12 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: tiredPct * 0.07 + (urgency > 0.78 ? 0.05 : 0) }}
        transition={{ duration: 0.25 }}
      />

      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, transparent 46%, rgba(0,0,0,0.19) 100%)" }}
        animate={{ opacity: tiredPct * 0.38 }}
        transition={{ duration: 0.3 }}
      />

      <AnimatePresence>
        {urgency > 0.78 && state.phase === "choosing" && (
          <motion.div
            key="panicPulse"
            className="absolute inset-0 bg-red-500/12"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.04, 0.16, 0.04] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.48, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {outcomeActive && isGood && (
          <motion.div
            key={`good-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.28, 0.10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
            style={{ background: "radial-gradient(circle at 50% 38%, rgba(16,185,129,0.42), rgba(16,185,129,0.10) 35%, transparent 72%)" }}
          />
        )}
        {outcomeActive && isBad && (
          <motion.div
            key={`bad-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, kind === "rekt" ? 0.36 : 0.25, 0.12] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            style={{ background: "radial-gradient(circle at 50% 42%, rgba(239,68,68,0.48), rgba(239,68,68,0.14) 38%, transparent 76%)" }}
          />
        )}
        {outcomeActive && isGlitch && (
          <motion.div
            key={`glitch-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.34, 0.16], x: [-2, 2, -1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36 }}
            style={{
              background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.15) 0px, rgba(0,0,0,0.12) 2px, transparent 5px)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
