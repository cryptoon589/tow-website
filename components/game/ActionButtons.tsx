"use client";

import { motion } from "framer-motion";
import type { Choice } from "@/components/game/engine";

type Props = {
  choices: Choice[];
  selectedChoiceId: string | null;
  hoveredChoiceId: string | null;
  onHoverChange: (id: string | null) => void;
  onSelect: (choice: Choice) => void;
  disabled?: boolean;
  timeLeftMs: number;
  choiceWindowMs: number;
};

const THOUGHTS = [
  "this should be fine",
  "eh… run it",
  "this might be stupid",
  "don’t overthink it",
  "maybe this works",
  "send it",
  "just survive",
  "idk but try",
  "last chance alpha",
];

const MICRO_COPY = [
  "tap and pray",
  "timeline decides",
  "no guarantees",
  "could age badly",
  "one more candle",
  "probably fine",
  "hold breath",
  "do it tired",
  "not financial anything",
];

type VisualStyle = {
  rotate: number;
  align: string;
  width: string;
  shell: string;
  glow: string;
  notch: string;
};

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function pick<T>(items: T[], seed: string) {
  return items[hashSeed(seed) % items.length];
}

function visualFor(choice: Choice, index: number): VisualStyle {
  // Deliberately NOT tied to hidden category. The button lies visually sometimes.
  const n = hashSeed(`${choice.id}-${choice.label}-${index}`);
  const vibe = n % 5;
  const align = ["self-start", "self-end", "self-center", "self-start", "self-end"][n % 5];
  const width = ["w-[88%]", "w-[92%]", "w-[84%]", "w-[96%]", "w-[90%]"][(n >> 3) % 5];
  const rotate = [-1.35, 0.8, -0.45, 1.15, 0.15][(n >> 6) % 5];

  if (vibe === 0) {
    return {
      rotate,
      align,
      width,
      shell: "border-[#E7DED2] bg-[#FFFCF8] shadow-[0_14px_35px_rgba(30,27,24,0.08)]",
      glow: "from-white/70 via-transparent to-black/[0.03]",
      notch: "bg-[#1E1B18]",
    };
  }

  if (vibe === 1) {
    return {
      rotate,
      align,
      width,
      shell: "border-amber-200/80 bg-[#FFF7DF] shadow-[0_14px_35px_rgba(245,158,11,0.10)]",
      glow: "from-amber-200/35 via-transparent to-white/10",
      notch: "bg-amber-500",
    };
  }

  if (vibe === 2) {
    return {
      rotate,
      align,
      width,
      shell: "border-red-200/75 bg-[#FFF1EE] shadow-[0_14px_35px_rgba(239,68,68,0.09)]",
      glow: "from-red-200/35 via-transparent to-white/10",
      notch: "bg-red-500",
    };
  }

  if (vibe === 3) {
    return {
      rotate,
      align,
      width,
      shell: "border-emerald-200/80 bg-[#F0FFF7] shadow-[0_14px_35px_rgba(16,185,129,0.08)]",
      glow: "from-emerald-200/35 via-transparent to-white/10",
      notch: "bg-emerald-500",
    };
  }

  return {
    rotate,
    align,
    width,
    shell: "border-violet-200/75 bg-[#F8F3FF] shadow-[0_14px_35px_rgba(139,92,246,0.08)]",
    glow: "from-violet-200/35 via-transparent to-white/10",
    notch: "bg-violet-500",
  };
}

export default function ActionButtons({
  choices,
  selectedChoiceId,
  hoveredChoiceId,
  onHoverChange,
  onSelect,
  disabled = false,
  timeLeftMs,
  choiceWindowMs,
}: Props) {
  const urgency = choiceWindowMs > 0 ? 1 - timeLeftMs / choiceWindowMs : 0;
  const panic = urgency > 0.82;

  return (
    <div className="flex w-full flex-col gap-2.5">
      {choices.map((choice, index) => {
        const isHovered = hoveredChoiceId === choice.id;
        const isSelected = selectedChoiceId === choice.id;
        const style = visualFor(choice, index);
        const thought = pick(THOUGHTS, `${choice.id}-thought`);
        const micro = pick(MICRO_COPY, `${choice.id}-micro`);

        return (
          <motion.button
            key={choice.id}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && onHoverChange(choice.id)}
            onMouseLeave={() => !disabled && onHoverChange(null)}
            onClick={() => !disabled && onSelect(choice)}
            initial={{ opacity: 0, y: 10, rotate: style.rotate, scale: 0.98 }}
            animate={{
              opacity: disabled && !isSelected ? 0.5 : 1,
              y: isHovered && !disabled ? -5 : 0,
              rotate: style.rotate,
              scale: isSelected ? 1.035 : panic && !disabled ? [1, 1.012, 1] : 1,
              x: panic && !disabled ? [0, index % 2 ? 1 : -1, 0] : 0,
            }}
            whileTap={!disabled ? { scale: 0.955, rotate: style.rotate * 0.5 } : undefined}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className={`${style.align} ${style.width} group relative overflow-hidden rounded-[28px] border px-4 py-3 text-left transition ${style.shell} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow}`} />
            <motion.div
              className={`absolute left-3 top-3 h-2 w-2 rounded-full ${style.notch}`}
              animate={{ opacity: panic ? [0.35, 1, 0.35] : 0.55, scale: isSelected ? 1.4 : 1 }}
              transition={{ duration: 0.7, repeat: panic ? Infinity : 0 }}
            />

            <div className="relative pl-4 pr-7">
              <div className="text-[15px] font-black lowercase leading-tight text-[#1E1B18]">
                {thought}
              </div>
              <div className="mt-1 text-[12px] font-medium leading-snug text-[#6F685F]">
                {choice.label}
              </div>
              <div className="mt-1 text-[10px] italic tracking-wide text-[#9A9288]">
                {choice.whisper || micro} · {micro}
              </div>
            </div>

            <motion.span
              animate={{ x: isHovered ? 0 : -5, opacity: isHovered || isSelected ? 1 : 0.42 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xl leading-none text-[#6F685F]"
            >
              →
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
