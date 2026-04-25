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
            tiredPct > 0.82
              ? "radial-gradient(circle at 50% 28%, #FFF7ED 0%, #FECACA 46%, #F3E6DC 100%)"
              : tiredPct > 0.55
              ? "radial-gradient(circle at 50% 28%, #FFFBEB 0%, #FED7AA 42%, #F7F2EA 100%)"
              : tiredPct > 0.32
              ? "radial-gradient(circle at 50% 28%, #FFFFFF 0%, #FDF2E5 54%, #F1E8DD 100%)"
              : "radial-gradient(circle at 50% 28%, #FFFFFF 0%, #F7F2EA 62%, #EFE7DD 100%)",
        }}
        transition={{ duration: 0.45 }}
      />

      {/* soft stage light behind the character */}
      <motion.div
        className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl"
        animate={{ scale: 1 + tiredPct * 0.18 + urgency * 0.06, opacity: 0.55 - tiredPct * 0.16 }}
        transition={{ duration: 0.35 }}
      />

      {/* living ambient red/green uncertainty, always subtle */}
      <motion.div
        className="absolute inset-0 opacity-45 blur-3xl"
        animate={{
          background: [
            "radial-gradient(circle at 22% 74%, rgba(239,68,68,0.10), transparent 34%), radial-gradient(circle at 78% 22%, rgba(16,185,129,0.09), transparent 34%)",
            "radial-gradient(circle at 26% 18%, rgba(16,185,129,0.10), transparent 34%), radial-gradient(circle at 74% 78%, rgba(239,68,68,0.11), transparent 34%)",
          ],
        }}
        transition={{ duration: 4.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      {/* tired pressure */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: tiredPct * 0.08 + (urgency > 0.78 ? 0.055 : 0) }}
        transition={{ duration: 0.25 }}
      />

      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, transparent 43%, rgba(0,0,0,0.23) 100%)" }}
        animate={{ opacity: tiredPct * 0.42 + (urgency > 0.85 ? 0.08 : 0) }}
        transition={{ duration: 0.3 }}
      />

      {/* subtle grain */}
      <motion.div
        className="absolute inset-0 opacity-[0.045] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,0.45) 0 1px, transparent 1px 4px)",
        }}
        animate={{ x: [0, -8, 6, 0], y: [0, 5, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <AnimatePresence>
        {urgency > 0.78 && state.phase === "choosing" && (
          <motion.div
            key="panicPulse"
            className="absolute inset-0 bg-red-500/16"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.03, 0.18, 0.03] }}
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
            animate={{ opacity: [0, 0.46, 0.13] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            style={{ background: "radial-gradient(circle at 50% 38%, rgba(16,185,129,0.58), rgba(16,185,129,0.18) 36%, transparent 76%)" }}
          />
        )}
        {outcomeActive && isBad && (
          <motion.div
            key={`bad-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, kind === "rekt" ? 0.58 : 0.42, 0.17] }}
            exit={{ opacity: 0 }}
            transition={{ duration: kind === "rekt" ? 0.62 : 0.48 }}
            style={{ background: "radial-gradient(circle at 50% 42%, rgba(239,68,68,0.68), rgba(239,68,68,0.22) 40%, transparent 78%)" }}
          />
        )}
        {outcomeActive && isGlitch && (
          <motion.div
            key={`glitch-${flashKey}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.42, 0.18], x: [-3, 3, -2, 2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(0,0,0,0.15) 2px, transparent 5px)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
