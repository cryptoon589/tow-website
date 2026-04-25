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
];

const MICRO_COPY = [
  "could flip either way",
  "green or red. no hints",
  "timeline decides",
  "feels rigged",
  "one tap changes it",
  "hold breath",
  "probably bait",
  "coin toss energy",
  "no safe clicks",
];

type VisualStyle = {
  rotate: number;
  align: string;
  width: string;
  radius: string;
  shell: string;
  dot: string;
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
  // Pure visual deception. This is intentionally NOT tied to hidden category/outcome.
  const n = hashSeed(`${choice.id}-${choice.label}-${index}-visual-lie`);
  const align = ["self-start", "self-end", "self-center", "self-start", "self-end"][n % 5];
  const width = ["w-[78%]", "w-[84%]", "w-[80%]", "w-[88%]", "w-[82%]"][(n >> 3) % 5];
  const rotate = [-2.1, 1.35, -0.9, 1.9, 0.35][(n >> 6) % 5];
  const radius = [
    "rounded-[30px_22px_30px_18px]",
    "rounded-[20px_34px_22px_32px]",
    "rounded-[34px_24px_18px_30px]",
    "rounded-[24px_18px_34px_26px]",
    "rounded-[28px_28px_18px_32px]",
  ][(n >> 9) % 5];

  return {
    rotate,
    align,
    width,
    radius,
    shell: "border-white/65 bg-[#FFFCF8]/88 shadow-[0_15px_45px_rgba(30,27,24,0.10)] backdrop-blur-xl",
    dot: ["bg-red-400", "bg-emerald-400", "bg-amber-400", "bg-violet-400"][(n >> 12) % 4],
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
    <div className="flex w-full flex-col gap-1.5">
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
      {choices.map((choice, index) => {
        const isHovered = hoveredChoiceId === choice.id;
        const isSelected = selectedChoiceId === choice.id;
        const style = visualFor(choice, index);

        let thought = pick(THOUGHTS, `${choice.id}-thought-${index}`);
        if (usedThoughts.has(thought)) {
          thought = THOUGHTS.find((item) => !usedThoughts.has(item)) || thought;
        }
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
            initial={{ opacity: 0, y: 8, rotate: style.rotate, scale: 0.96 }}
            animate={{
              opacity: disabled && !isSelected ? 0.46 : 1,
              y: isHovered && !disabled ? -4 : 0,
              rotate: style.rotate,
              scale: isSelected ? 1.04 : panic && !disabled ? [1, 1.012, 1] : 1,
              x: panic && !disabled ? [0, index % 2 ? 1 : -1, 0] : 0,
            }}
            whileTap={!disabled ? { scale: 0.94, rotate: style.rotate * 0.35 } : undefined}
            transition={{ type: "spring", stiffness: 390, damping: 24 }}
            className={`${style.align} ${style.width} ${style.radius} group relative min-h-[58px] overflow-hidden border px-4 py-2 text-left ${style.shell} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {/* Each button breathes between red and green so the user never trusts the visual. */}
            <motion.div
              className="pointer-events-none absolute -inset-10 opacity-70 blur-2xl"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 30%, rgba(239,68,68,0.34), transparent 48%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.12), transparent 45%)",
                  "radial-gradient(circle at 20% 30%, rgba(16,185,129,0.34), transparent 48%), radial-gradient(circle at 80% 70%, rgba(239,68,68,0.14), transparent 45%)",
                  "radial-gradient(circle at 20% 30%, rgba(239,68,68,0.26), transparent 48%), radial-gradient(circle at 80% 70%, rgba(16,185,129,0.22), transparent 45%)",
                ],
              }}
              transition={{ duration: 1.45 + index * 0.22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
            />

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.78),transparent_45%)]" />

            <motion.div
              className={`absolute left-3 top-3 h-2 w-2 rounded-full ${style.dot}`}
              animate={{ opacity: [0.35, 1, 0.35], scale: isSelected ? 1.5 : [1, 1.25, 1] }}
              transition={{ duration: 1.15 + index * 0.18, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative pl-4 pr-6">
              <div className="text-[15px] font-black lowercase leading-tight text-[#1E1B18]">
                {thought}
              </div>
              <div className="mt-1 line-clamp-1 text-[11px] font-semibold lowercase leading-snug text-[#6F685F]">
                {choice.label}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[9px] italic tracking-wide text-[#9A9288]">
                {micro}
              </div>
            </div>

            <motion.span
              animate={{ x: isHovered ? 1 : -4, opacity: isHovered || isSelected ? 1 : 0.38 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-lg leading-none text-[#6F685F]"
            >
              →
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
