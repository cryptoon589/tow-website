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
  "maybe this works",
  "this might be stupid",
  "don’t overthink it",
  "send it",
  "just survive",
  "idk but try",
  "one more tap",
  "wait… maybe",
  "run the risk",
  "don’t blink",
  "this feels wrong",
  "one clean click",
];

const MICRO_COPY = [
  "red lies. green lies.",
  "timeline decides",
  "probably bait",
  "no safe clicks",
  "famous last words",
  "one tap changes it",
  "chart is acting weird",
  "coin toss energy",
  "too calm to trust",
];

type BubbleStyle = {
  rotate: number;
  y: number;
  width: string;
  radius: string;
  dot: string;
  delay: number;
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

function bubbleFor(choice: Choice, index: number): BubbleStyle {
  const n = hashSeed(`${choice.id}-${choice.label}-${index}-thought-bubble-lie`);
  const rotations = [-4.6, 3.4, -2.2, 2.8, -3.7, 4.1];
  const yOffsets = [-6, 14, 2, 20, -2, 10];
  const widths = ["w-[33%]", "w-[31%]", "w-[35%]", "w-[30%]"];
  const radii = [
    "rounded-[44px_34px_48px_30px]",
    "rounded-[32px_52px_34px_46px]",
    "rounded-[54px_34px_42px_30px]",
    "rounded-[38px_30px_56px_42px]",
  ];
  return {
    rotate: rotations[(n >> 2) % rotations.length],
    y: yOffsets[(n >> 5) % yOffsets.length],
    width: widths[index % widths.length],
    radius: radii[(n >> 8) % radii.length],
    dot: ["bg-red-400", "bg-emerald-400", "bg-amber-400", "bg-violet-400", "bg-sky-400"][(n >> 12) % 5],
    delay: ((n >> 15) % 9) * 0.08,
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
  const panic = urgency > 0.8;
  const secondsLeft = Math.max(0, timeLeftMs / 1000);
  const showLateTimer = timeLeftMs > 0 && timeLeftMs < 3200;
  const showHint = !showLateTimer && urgency > 0.62;
  const usedThoughts = new Set<string>();

  return (
    <div className="w-full">
      <div className="h-5 text-center">
        {showLateTimer ? (
          <motion.div
            animate={{ scale: panic ? [1, 1.08, 1] : 1, x: timeLeftMs < 950 ? [0, -1, 1, 0] : 0 }}
            transition={{ duration: 0.28, repeat: panic ? Infinity : 0 }}
            className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500"
          >
            choose · {secondsLeft.toFixed(1)}
          </motion.div>
        ) : showHint ? (
          <motion.div
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8278]"
          >
            don’t freeze
          </motion.div>
        ) : null}
      </div>

      <div className="relative mx-auto flex h-[142px] w-full max-w-[560px] items-center justify-center gap-2 md:h-[132px] md:gap-3">
        {choices.map((choice, index) => {
          const isHovered = hoveredChoiceId === choice.id;
          const isSelected = selectedChoiceId === choice.id;
          const style = bubbleFor(choice, index);

          let thought = pick(THOUGHTS, `${choice.id}-thought-${index}`);
          if (usedThoughts.has(thought)) thought = THOUGHTS.find((item) => !usedThoughts.has(item)) || thought;
          usedThoughts.add(thought);
          const micro = pick(MICRO_COPY, `${choice.id}-micro-${index}`);

          return (
            <motion.button
              key={choice.id}
              type="button"
              disabled={disabled}
              onMouseEnter={() => !disabled && onHoverChange(choice.id)}
              onMouseLeave={() => !disabled && onHoverChange(null)}
              onClick={() => !disabled && onSelect(choice)}
              initial={{ opacity: 0, y: style.y + 10, rotate: style.rotate, scale: 0.88 }}
              animate={{
                opacity: disabled && !isSelected ? 0.36 : 1,
                y: isHovered && !disabled ? style.y - 6 : panic && !disabled ? [style.y, style.y - 2, style.y] : style.y,
                rotate: isHovered && !disabled ? style.rotate * 0.55 : style.rotate,
                scale: isSelected ? 1.08 : panic && !disabled ? [1, 1.018, 1] : 1,
                x: panic && !disabled ? [0, index % 2 ? 1 : -1, 0] : 0,
              }}
              whileTap={!disabled ? { scale: 0.91, rotate: style.rotate * 0.25 } : undefined}
              transition={{ type: "spring", stiffness: 420, damping: 25 }}
              className={`${style.width} ${style.radius} group relative min-h-[88px] overflow-visible border border-white/70 bg-[#FFFCF8]/88 px-3 py-3 text-center shadow-[0_18px_52px_rgba(30,27,24,0.13)] outline-none backdrop-blur-xl ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* anime thought-bubble tail / dots */}
              <span className="pointer-events-none absolute -bottom-2 left-1/2 h-4 w-5 -translate-x-1/2 rotate-12 rounded-full border border-white/70 bg-[#FFFCF8]/80 shadow-sm" />
              <span className="pointer-events-none absolute -bottom-4 left-[58%] h-2.5 w-2.5 rounded-full border border-white/70 bg-[#FFFCF8]/75 shadow-sm" />

              <motion.div
                className="pointer-events-none absolute -inset-12 rounded-full opacity-75 blur-2xl"
                animate={{
                  background: [
                    "radial-gradient(circle at 30% 30%, rgba(239,68,68,0.40), transparent 48%), radial-gradient(circle at 78% 74%, rgba(16,185,129,0.14), transparent 42%)",
                    "radial-gradient(circle at 26% 32%, rgba(16,185,129,0.38), transparent 48%), radial-gradient(circle at 80% 70%, rgba(239,68,68,0.18), transparent 42%)",
                    "radial-gradient(circle at 50% 8%, rgba(251,191,36,0.22), transparent 42%), radial-gradient(circle at 28% 82%, rgba(239,68,68,0.24), transparent 44%), radial-gradient(circle at 86% 78%, rgba(16,185,129,0.23), transparent 42%)",
                  ],
                }}
                transition={{ duration: 1.15 + index * 0.22, delay: style.delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              />

              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.88),transparent_50%)]" />
              <motion.div
                className={`absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${style.dot}`}
                animate={{ opacity: [0.35, 1, 0.35], scale: isSelected ? 1.55 : [1, 1.25, 1] }}
                transition={{ duration: 1.05 + index * 0.18, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative z-10 flex h-full flex-col items-center justify-center px-1 pt-2">
                <div className="line-clamp-2 text-balance text-[13px] font-black lowercase leading-[1.05] text-[#1E1B18] md:text-[14px]">
                  {thought}
                </div>
                <div className="mt-1 line-clamp-1 text-[10px] font-semibold lowercase leading-snug text-[#6F685F]">
                  {choice.label}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[8px] italic tracking-wide text-[#9A9288]">
                  {micro}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
