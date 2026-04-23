"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "@/components/game/engine";

type SceneLayerProps = {
  state: GameState;
  timeLeftMs: number;
  choiceWindowMs: number;
};

export function SceneLayer({
  state,
  timeLeftMs,
  choiceWindowMs,
}: SceneLayerProps) {
  const pct = timeLeftMs / choiceWindowMs;

  const isChoosing = state.phase === "choosing";
  const isResolving = state.phase === "resolving";

  const tensionLevel =
    pct > 0.4 ? 0 :
    pct > 0.2 ? 1 :
    2;

  const tiredPct = state.tired;

  const panic = tiredPct > 70;
  const unstable = tiredPct > 35;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

      {/* BASE AMBIENT */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundColor:
            panic
              ? "#2A0F0F"
              : unstable
              ? "#2A2415"
              : "#F7F5F2",
        }}
        transition={{ duration: 0.6 }}
      />

      {/* TIMER TENSION PULSE */}
      {isChoosing && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity:
              tensionLevel === 0
                ? 0
                : tensionLevel === 1
                ? 0.06
                : 0.12,
          }}
          style={{
            background:
              tensionLevel === 2
                ? "radial-gradient(circle at center, rgba(255,0,0,0.2), transparent 70%)"
                : "radial-gradient(circle at center, rgba(0,0,0,0.1), transparent 70%)",
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* OUTCOME FLASH */}
      <AnimatePresence>
        {isResolving && state.lastOutcome && (
          <motion.div
            key={state.lastOutcome.kind}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.15,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            style={{
              background:
                state.lastOutcome.kind === "win" ||
                state.lastOutcome.kind === "winSmall"
                  ? "radial-gradient(circle, rgba(0,255,100,0.3), transparent 60%)"
                  : state.lastOutcome.kind === "glitch"
                  ? "repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 6px)"
                  : "radial-gradient(circle, rgba(255,0,0,0.3), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* GLITCH DISTORTION (RARE) */}
      {state.lastOutcome?.kind === "glitch" && (
        <motion.div
          className="absolute inset-0"
          animate={{
            x: [0, -2, 2, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 0.25,
            repeat: 2,
          }}
          style={{
            backdropFilter: "blur(1px)",
          }}
        />
      )}
    </div>
  );
}

export default SceneLayer;