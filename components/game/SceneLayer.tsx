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
              ? "radial-gradient(circle at 50% 30%, #FFF7ED 0%, #FECACA 45%, #F3E0D7 100%)"
              : tiredPct > 0.55
              ? "radial-gradient(circle at 50% 30%, #FFFBEB 0%, #FED7AA 42%, #F7F2EA 100%)"
              : tiredPct > 0.32
              ? "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #FDF2E5 54%, #F1E8DD 100%)"
              : "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #F7F2EA 64%, #EFE7DD 100%)",
        }}
        transition={{ duration: 0.45 }}
      />

      {/* soft stage light behind TOW */}
      <motion.div
        className="absolute left-1/2 top-[41%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/62 blur-3xl"
        animate={{ scale: 1 + tiredPct * 0.16 + urgency * 0.08, opacity: 0.62 - tiredPct * 0.16 }}
        transition={{ duration: 0.35 }}
      />

      {/* ambient uncertainty */}
      <motion.div
        className="absolute inset-0 opacity-55 blur-3xl"
        animate={{
          background: [
            "radial-gradient(circle at 18% 76%, rgba(239,68,68,0.13), transparent 34%), radial-gradient(circle at 82% 24%, rgba(16,185,129,0.11), transparent 34%)",
            "radial-gradient(circle at 24% 20%, rgba(16,185,129,0.13), transparent 34%), radial-gradient(circle at 78% 78%, rgba(239,68,68,0.14), transparent 34%)",
          ],
        }}
        transition={{ duration: 4.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      {/* moving chart arrows / emotional direction */}
      <AnimatePresence mode="wait">
        {outcomeActive && isBad && (
          <motion.div key={`down-${flashKey}`} className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0, x: -40, y: -20, rotate: -18 }}
              animate={{ opacity: [0, 0.28, 0], x: [60, 10, -120], y: [80, 160, 260] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute left-[58%] top-[18%] text-[120px] font-black text-red-500/40"
            >
              ↓
            </motion.div>
          </motion.div>
        )}
        {outcomeActive && isGood && (
          <motion.div key={`up-${flashKey}`} className="absolute inset-0">
            <motion.div
              initial={{ opacity: 0, x: 40, y: 70, rotate: 18 }}
              animate={{ opacity: [0, 0.24, 0], x: [-50, 10, 130], y: [250, 130, 20] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="absolute left-[32%] top-[22%] text-[120px] font-black text-emerald-500/40"
            >
              ↑
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* pressure + vignette */}
      <motion.div className="absolute inset-0 bg-black" animate={{ opacity: tiredPct * 0.075 + (urgency > 0.78 ? 0.055 : 0) }} transition={{ duration: 0.25 }} />
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.26) 100%)" }}
        animate={{ opacity: tiredPct * 0.48 + (urgency > 0.85 ? 0.1 : 0) }}
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
            animate={{ opacity: [0, 0.62, 0.18] }}
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
            animate={{ opacity: [0, kind === "rekt" ? 0.72 : 0.56, 0.22] }}
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
