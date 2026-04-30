"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  state: string;
  timeLeftMs?: number;
  choiceWindowMs?: number;
  width?: number;
  height?: number;
};

const BASE_PATH = "/tow/base";
const FACE_PATH = "/tow/face";
const VFX_PATH = "/tow/vfx";

type ResolvedMode = {
  pose: "idle" | "lean";
  face: string;
  base: string;
  vfx: string | null;
  type: "idle" | "thinking" | "win" | "winSmall" | "lose" | "loseSmall" | "rekt" | "glitch";
};

type IdleVariant = "neutral" | "blink" | "lookaway" | "sigh" | "leanChoose";

function resolveMode(state: string): ResolvedMode {
  switch (state) {
    case "thinking":
      return {
        pose: "idle",
        face: "confused",
        base: "base-idle-phone-check",
        vfx: "vfx-question",
        type: "thinking",
      };

    case "react-win":
      return {
        pose: "lean",
        face: "win",
        base: "base-lean-phone-tap",
        vfx: "vfx-phone-check-green",
        type: "win",
      };

    case "react-winSmall":
      return {
        pose: "lean",
        face: "winSmall",
        base: "base-lean-phone-tap",
        vfx: "vfx-phone-check-green",
        type: "winSmall",
      };

    case "react-lose":
      return {
        pose: "lean",
        face: "lose",
        base: "base-lean-phone-check",
        vfx: "vfx-phone-check-red",
        type: "lose",
      };

    case "react-loseSmall":
      return {
        pose: "lean",
        face: "loseSmall",
        base: "base-lean-phone-check",
        vfx: "vfx-phone-check-red",
        type: "loseSmall",
      };

    case "react-rekt":
      return {
        pose: "idle",
        face: "rekt",
        base: "base-idle-phone-check",
        vfx: "vfx-phone-check-impact",
        type: "rekt",
      };

    case "react-glitch":
      return {
        pose: "idle",
        face: "shock",
        base: "base-idle-phone-check",
        vfx: "vfx-glitch",
        type: "glitch",
      };

    case "idle-lookaway":
      return {
        pose: "idle",
        face: "lookaway",
        base: "base-idle-neutral",
        vfx: null,
        type: "idle",
      };

    case "idle-stress":
      return {
        pose: "idle",
        face: "sigh",
        base: "base-idle-phone-check",
        vfx: "vfx-question",
        type: "idle",
      };

    default:
      return {
        pose: "idle",
        face: "neutral",
        base: "base-idle-neutral",
        vfx: null,
        type: "idle",
      };
  }
}

function getIdleFaceVariant(baseFace: string, idleVariant: IdleVariant) {
  if (
    baseFace === "win" ||
    baseFace === "winSmall" ||
    baseFace === "lose" ||
    baseFace === "loseSmall" ||
    baseFace === "rekt" ||
    baseFace === "shock" ||
    baseFace === "confused"
  ) {
    return baseFace;
  }

  if (idleVariant === "neutral" || idleVariant === "leanChoose") return baseFace;

  return idleVariant;
}

export default function TowCharacter({
  state,
  timeLeftMs = 0,
  choiceWindowMs = 1,
  width = 320,
  height = 320,
}: Props) {
  const mode = useMemo(() => resolveMode(state), [state]);

  const urgency = useMemo(() => {
    if (!timeLeftMs || !choiceWindowMs) return 0;
    return 1 - timeLeftMs / choiceWindowMs;
  }, [timeLeftMs, choiceWindowMs]);

  const isIdleState = mode.type === "idle";

  const [idleVariant, setIdleVariant] = useState<IdleVariant>("neutral");

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    if (!isIdleState) {
      setIdleVariant("neutral");
      return;
    }

    let cancelled = false;

    const scheduleNextIdleBeat = () => {
      if (cancelled) return;

      // More frequent idle beats = more alive.
      const nextDelay =
        urgency > 0.7
          ? 420 + Math.random() * 700
          : urgency > 0.4
          ? 520 + Math.random() * 850
          : 650 + Math.random() * 950;

      idleTimerRef.current = setTimeout(() => {
        if (cancelled) return;

        const roll = Math.random();
        let nextVariant: IdleVariant = "blink";

        // Blink often. Lean-choose also appears often to create life.
        if (urgency > 0.72) {
          if (roll < 0.42) nextVariant = "blink";
          else if (roll < 0.72) nextVariant = "leanChoose";
          else if (roll < 0.9) nextVariant = "lookaway";
          else nextVariant = "sigh";
        } else if (urgency > 0.4) {
          if (roll < 0.5) nextVariant = "blink";
          else if (roll < 0.78) nextVariant = "leanChoose";
          else if (roll < 0.93) nextVariant = "lookaway";
          else nextVariant = "sigh";
        } else {
          if (roll < 0.55) nextVariant = "blink";
          else if (roll < 0.78) nextVariant = "leanChoose";
          else if (roll < 0.92) nextVariant = "lookaway";
          else nextVariant = "sigh";
        }

        setIdleVariant(nextVariant);

        const holdMs =
          nextVariant === "blink"
            ? 115
            : nextVariant === "leanChoose"
            ? 700
            : nextVariant === "sigh"
            ? 760
            : 520;

        resetTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setIdleVariant("neutral");
          scheduleNextIdleBeat();
        }, holdMs);
      }, nextDelay);
    };

    setIdleVariant("neutral");
    scheduleNextIdleBeat();

    return () => {
      cancelled = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [isIdleState, urgency]);

  const finalPose = useMemo<"idle" | "lean">(() => {
    if (isIdleState && idleVariant === "leanChoose") return "lean";
    return mode.pose;
  }, [isIdleState, idleVariant, mode.pose]);

  const finalBase = useMemo(() => {
    if (isIdleState && idleVariant === "leanChoose") {
      return "base-lean-phone-choose";
    }

    return mode.base;
  }, [isIdleState, idleVariant, mode.base]);

  const finalFace = useMemo(() => {
    return getIdleFaceVariant(mode.face, idleVariant);
  }, [mode.face, idleVariant]);

  const baseFile = `${finalBase}.png`;
  const faceFile = `face-${finalPose}-${finalFace}.png`;
  const vfxFile = mode.vfx ? `${mode.vfx}.png` : null;

  const idleScale = 1 + urgency * 0.015;

  const motionProps = useMemo(() => {
    switch (mode.type) {
      case "win":
        return {
          y: [-6, 0],
          scale: [1.04, 1],
        };

      case "winSmall":
        return {
          y: [-4, 0],
          scale: [1.025, 1],
        };

      case "lose":
        return {
          y: [6, 0],
          scale: [0.97, 1],
        };

      case "loseSmall":
        return {
          y: [4, 0],
          scale: [0.985, 1],
        };

      case "rekt":
        return {
          x: [-8, 8, -5, 5, 0],
          scale: [1.06, 1],
        };

      case "glitch":
        return {
          x: [-4, 4, -2, 2, 0],
          y: [2, -2, 1, -1, 0],
        };

      default:
        return {};
    }
  }, [mode.type]);

  return (
    <motion.div
      style={{ width, height, position: "relative" }}
      animate={{
        y: mode.type === "idle" ? [0, -4, 0] : 0,
        rotate:
          mode.type === "idle"
            ? [0, urgency > 0.65 ? -0.45 : -0.18, 0.18, 0]
            : 0,
      }}
      transition={{
        y: {
          duration: urgency > 0.7 ? 2.2 : 3.4,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: urgency > 0.7 ? 2.4 : 4.2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      <motion.div
        style={{ width, height, position: "relative" }}
        animate={{
          scale: idleScale,
          ...motionProps,
        }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
      >
        <Image
          src={`${BASE_PATH}/${baseFile}`}
          alt="base"
          fill
          priority
          style={{ objectFit: "contain" }}
        />

        <Image
          src={`${FACE_PATH}/${faceFile}`}
          alt="face"
          fill
          style={{
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />

        {vfxFile && (
          <Image
            src={`${VFX_PATH}/${vfxFile}`}
            alt="vfx"
            fill
            style={{
              objectFit: "contain",
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
