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
  const isResolving = state.phase === "resolving" || state.phase === "gameOver";

  const isBad = isResolving && ["lose", "loseSmall", "rekt"].includes(kind || "");
  const isGood = isResolving && ["win", "winSmall"].includes(kind || "");
  const isGlitch = isResolving && kind === "glitch";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#F7F2EA] pointer-events-none">
      <motion.div
        className="absolute inset-0"
        animate={{
          background:
            tiredPct > 0.78
              ? "radial-gradient(circle at 50% 30%, #FFF7ED 0%, #FEE2E2 55%, #F7F2EA 100%)"
              : tiredPct > 0.48
              ? "radial-gradient(circle at 50% 30%, #FFFBEB 0%, #F7F2EA 62%, #EFE7DD 100%)"
              : "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F7F2EA 64%, #EFE7DD 100%)",
        }}
        transition={{ duration: 0.45 }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl"
        animate={{ scale: 1 + tiredPct * 0.12 + urgency * 0.04, opacity: 0.42 - tiredPct * 0.12 }}
        transition={{ duration: 0.35 }}
      />

      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: tiredPct * 0.11 + (urgency > 0.78 ? 0.08 : 0) }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, transparent 46%, rgba(0,0,0,0.24) 100%)" }}
        animate={{ opacity: tiredPct * 0.58 }}
        transition={{ duration: 0.35 }}
      />

      <AnimatePresence>
        {urgency > 0.8 && state.phase === "choosing" && (
          <motion.div
            key="panicPulse"
            className="absolute inset-0 bg-red-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.05, 0.16, 0.05] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGood && <motion.div key="good" className="absolute inset-0 bg-emerald-300" initial={{ opacity: 0 }} animate={{ opacity: 0.16 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} />}
        {isBad && <motion.div key="bad" className="absolute inset-0 bg-red-500" initial={{ opacity: 0 }} animate={{ opacity: kind === "rekt" ? 0.28 : 0.18 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}
        {isGlitch && (
          <motion.div
            key="glitch"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35, x: [-2, 2, -1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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
