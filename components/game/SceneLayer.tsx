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
  const outcomeActive = state.phase === "resolving" || state.gameOver;
  const pressure = Math.max(tiredPct, urgency * 0.8);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F7F2EA]">
      {/* base mood wash */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(circle at 50% 38%, rgba(255,255,255,0.78), rgba(247,242,234,0.90) 32%, rgba(239,68,68,${0.04 + tiredPct * 0.16}) 74%, rgba(30,27,24,${0.03 + tiredPct * 0.08}) 100%)`,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* subtle pressure ripple / wave field */}
      <motion.div
        className="absolute inset-[-18%] opacity-40 mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 50% 45%, rgba(30,27,24,0.075) 0px, rgba(30,27,24,0.075) 1px, transparent 2px, transparent 9px)",
        }}
        animate={{
          scale: [1, 1.035 + pressure * 0.055, 1],
          rotate: [0, pressure > 0.7 ? 0.4 : 0.15, 0],
          opacity: 0.16 + pressure * 0.36,
        }}
        transition={{ duration: 2.8 - pressure * 1.25, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/5"
        animate={{
          scale: [0.7, 1.25 + pressure * 0.3],
          opacity: [0.16 + pressure * 0.12, 0],
        }}
        transition={{ duration: 2.4 - pressure * 0.9, repeat: Infinity, ease: "easeOut" }}
      />

      {/* ambient chart arrows */}
      <AnimatePresence>
        {outcomeActive && isGood && (
          <motion.div
            key={`arrow-good-${flashKey}`}
            className="absolute right-[15%] top-[28%] text-[120px] font-black text-emerald-500/18"
            initial={{ opacity: 0, y: 42, scale: 0.82 }}
            animate={{ opacity: [0, 1, 0], y: [-10, -70], scale: [0.9, 1.1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          >
            ↑
          </motion.div>
        )}
        {outcomeActive && isBad && (
          <motion.div
            key={`arrow-bad-${flashKey}`}
            className="absolute left-[14%] top-[24%] text-[140px] font-black text-red-500/20"
            initial={{ opacity: 0, y: -40, scale: 0.85 }}
            animate={{ opacity: [0, 1, 0], y: [0, 86], scale: [0.9, 1.12] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95 }}
          >
            ↓
          </motion.div>
        )}
      </AnimatePresence>

      {/* pressure + vignette */}
      <motion.div className="absolute inset-0 bg-black" animate={{ opacity: tiredPct * 0.06 + (urgency > 0.78 ? 0.045 : 0) }} transition={{ duration: 0.25 }} />
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.25) 100%)" }}
        animate={{ opacity: tiredPct * 0.42 + (urgency > 0.85 ? 0.1 : 0) }}
        transition={{ duration: 0.3 }}
      />

      {/* subtle grain */}
      <motion.div
        className="absolute inset-0 opacity-[0.048] mix-blend-multiply"
        style={{ backgroundImage: "repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,0.45) 0 1px, transparent 1px 4px)" }}
        animate={{ x: [0, -8, 6, 0], y: [0, 5, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <AnimatePresence>
        {urgency > 0.78 && state.phase === "choosing" && (
          <motion.div
            key="panicPulse"
            className="absolute inset-0 bg-red-500/18"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.03, 0.19, 0.03] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.46, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {outcomeActive && isGood && (
          <motion.div
            key={`good-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.62, 0.16] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.62 }}
            style={{ background: "radial-gradient(circle at 50% 38%, rgba(16,185,129,0.72), rgba(16,185,129,0.22) 38%, transparent 78%)" }}
          />
        )}
        {outcomeActive && isBad && (
          <motion.div
            key={`bad-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, kind === "rekt" ? 0.72 : 0.58, 0.22] }}
            exit={{ opacity: 0 }}
            transition={{ duration: kind === "rekt" ? 0.72 : 0.56 }}
            style={{ background: "radial-gradient(circle at 50% 42%, rgba(239,68,68,0.82), rgba(239,68,68,0.28) 40%, transparent 78%)" }}
          />
        )}
        {outcomeActive && isGlitch && (
          <motion.div
            key={`glitch-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0.18], x: [-3, 3, -2, 2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
            style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.2) 0px, rgba(0,0,0,0.16) 2px, transparent 5px)", mixBlendMode: "overlay" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
