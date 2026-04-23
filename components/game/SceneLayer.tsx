"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import type { GameState } from "@/components/game/engine";

type Props = {
  state: GameState;
  timeLeftMs: number;
  choiceWindowMs: number;
};

export default function SceneLayer({
  state,
  timeLeftMs,
  choiceWindowMs,
}: Props) {
  // -----------------------------
  // 🧠 NORMALIZED VALUES
  // -----------------------------
  const urgency = useMemo(() => {
    if (!choiceWindowMs) return 0;
    return 1 - timeLeftMs / choiceWindowMs;
  }, [timeLeftMs, choiceWindowMs]);

  const tiredPct = Math.min(1, state.tired / 100);

  // -----------------------------
  // 🎯 PRESSURE CURVE (NON-LINEAR)
  // -----------------------------
  const pressure = useMemo(() => {
    if (urgency < 0.6) return 0;
    if (urgency < 0.85) return (urgency - 0.6) * 2;
    return 1;
  }, [urgency]);

  // -----------------------------
  // 🎭 STATE FLAGS
  // -----------------------------
  const isChoosing = state.phase === "choosing";
  const isResolving = state.phase === "resolving";

  const kind = state.lastOutcome?.kind;

  const isBad =
    isResolving && ["lose", "loseSmall", "rekt"].includes(kind || "");

  const isGood =
    isResolving && ["win", "winSmall"].includes(kind || "");

  const isGlitch = isResolving && kind === "glitch";

  // -----------------------------
  // 🎨 BASE COLOR
  // -----------------------------
  const baseBg = "#F7F5F2";

  // -----------------------------
  // 🌫 OVERLAYS
  // -----------------------------
  const tiredOverlay = tiredPct * 0.15;
  const pressureOverlay = isChoosing ? pressure * 0.25 : 0;

  // 🔥 pulse speed increases near end
  const pulseScale =
    pressure > 0.8 ? 1.02 :
    pressure > 0.4 ? 1.01 :
    1;

  // -----------------------------
  // 🧱 RENDER
  // -----------------------------
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">

      {/* BASE BACKGROUND */}
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: baseBg }}
        transition={{ duration: 0.4 }}
      />

      {/* TIRED VIGNETTE */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.25) 100%)",
        }}
        animate={{ opacity: tiredOverlay }}
        transition={{ duration: 0.3 }}
      />

      {/* PRESSURE PULSE */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: pressureOverlay,
          scale: pulseScale,
        }}
        style={{
          background: "rgba(0,0,0,0.35)",
        }}
        transition={{
          duration: pressure > 0.8 ? 0.4 : 0.8,
          repeat: pressure > 0.6 ? Infinity : 0,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* BAD FLASH */}
      <AnimatePresence>
        {isBad && (
          <motion.div
            key="bad"
            className="absolute inset-0 bg-red-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>

      {/* GOOD FLASH */}
      <AnimatePresence>
        {isGood && (
          <motion.div
            key="good"
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* GLITCH EFFECT */}
      <AnimatePresence>
        {isGlitch && (
          <motion.div
            key="glitch"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(0,0,0,0.1) 2px)",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}