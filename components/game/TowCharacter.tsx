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
  type:
    | "idle"
    | "thinking"
    | "win"
    | "winSmall"
    | "lose"
    | "loseSmall"
    | "rekt"
    | "glitch";
};

type IdleVariant = "neutral" | "blink" | "lookaway" | "sigh" | "leanChoose";
type UrgencyBucket = "low" | "mid" | "high";

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

  if (idleVariant === "neutral" || idleVariant === "leanChoose") {
    return baseFace;
  }

  return idleVariant;
}

function getUrgencyBucket(urgency: number): UrgencyBucket {
  if (urgency > 0.7) return "high";
  if (urgency > 0.4) return "mid";
  return "low";
}

function pickIdleVariant(bucket: UrgencyBucket): IdleVariant {
  const roll = Math.random();

  if (bucket === "high") {
    if (roll < 0.46) return "blink";
    if (roll < 0.8) return "leanChoose";
    if (roll < 0.93) return "lookaway";
    return "sigh";
  }

  if (bucket === "mid") {
    if (roll < 0.52) return "blink";
    if (roll < 0.78) return "leanChoose";
    if (roll < 0.93) return "lookaway";
    return "sigh";
  }

  if (roll < 0.6) return "blink";
  if (roll < 0.8) return "leanChoose";
  if (roll < 0.94) return "lookaway";
  return "sigh";
}

function getIdleDelay(bucket: UrgencyBucket) {
  if (bucket === "high") return 520 + Math.random() * 620;
  if (bucket === "mid") return 650 + Math.random() * 800;
  return 800 + Math.random() * 950;
}

function getIdleHoldMs(variant: IdleVariant) {
  if (variant === "blink") return 135;
  if (variant === "leanChoose") return 820;
  if (variant === "sigh") return 760;
  return 560;
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
    return Math.max(0, Math.min(1, 1 - timeLeftMs / choiceWindowMs));
  }, [timeLeftMs, choiceWindowMs]);

  // Important: use a stable bucket instead of raw urgency in the idle effect.
  // Raw timeLeftMs changes constantly during gameplay and was restarting the
  // blink/lean timers before they could fire.
  const urgencyBucket = getUrgencyBucket(urgency);
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

      idleTimerRef.current = setTimeout(() => {
        if (cancelled) return;

        const nextVariant = pickIdleVariant(urgencyBucket);
        setIdleVariant(nextVariant);

        resetTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setIdleVariant("neutral");
          scheduleNextIdleBeat();
        }, getIdleHoldMs(nextVariant));
      }, getIdleDelay(urgencyBucket));
    };

    setIdleVariant("neutral");
    scheduleNextIdleBeat();

    return () => {
      cancelled = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [isIdleState, urgencyBucket]);

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
