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
  "could flip either way",
  "green lies. red lies.",
  "timeline decides",
  "feels rigged",
  "one tap changes it",
  "hold breath",
  "probably bait",
  "coin toss energy",
  "no safe clicks",
  "chart is acting weird",
  "too calm to trust",
  "famous last words",
];

type VisualStyle = {
  rotate: number;
  position: string;
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

function visualFor(choice: Choice, index: number, total: number): VisualStyle {
  // Pure visual deception. This is intentionally NOT tied to hidden category/outcome.
  const n = hashSeed(`${choice.id}-${choice.label}-${index}-radial-visual-lie`);

  const layouts = total <= 2
    ? [
        "left-[3%] top-[12px]",
        "right-[3%] top-[78px]",
      ]
    : [
        "left-[2%] top-[8px]",
        "right-[1%] top-[58px]",
        "left-1/2 top-[116px] -translate-x-1/2",
      ];

  const widths = total <= 2
    ? ["w-[64%]", "w-[62%]"]
    : ["w-[63%]", "w-[58%]", "w-[68%]"];

  const rotates = [-5.5, 4.25, -2.4, 3.5, -3.2, 2.15];
  const radii = [
    "rounded-[34px_22px_36px_18px]",
    "rounded-[20px_38px_24px_34px]",
    "rounded-[38px_24px_20px_34px]",
    "rounded-[26px_18px_38px_28px]",
    "rounded-[42px_28px_22px_32px]",
  ];

  return {
    rotate: rotates[(n >> 3) % rotates.length],
    position: layouts[index % layouts.length],
    width: widths[index % widths.length],
    radius: radii[(n >> 7) % radii.length],
    dot: ["bg-red-400", "bg-emerald-400", "bg-amber-400", "bg-violet-400", "bg-sky-400"][(n >> 11) % 5],
    delay: ((n >> 15) % 7) * 0.09,
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

      <div className="relative mx-auto h-[190px] w-full max-w-[430px] md:h-[184px]">
        {choices.map((choice, index) => {
          const isHovered = hoveredChoiceId === choice.id;
          const isSelected = selectedChoiceId === choice.id;
          const style = visualFor(choice, index, choices.length);

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
              initial={{ opacity: 0, y: 12, rotate: style.rotate, scale: 0.92 }}
              animate={{
                opacity: disabled && !isSelected ? 0.42 : 1,
                y: isHovered && !disabled ? -5 : panic && !disabled ? [0, -1, 0] : 0,
                rotate: isHovered && !disabled ? style.rotate * 0.55 : style.rotate,
                scale: isSelected ? 1.06 : panic && !disabled ? [1, 1.014, 1] : 1,
                x: panic && !disabled ? [0, index % 2 ? 1 : -1, 0] : 0,
              }}
              whileTap={!disabled ? { scale: 0.93, rotate: style.rotate * 0.25 } : undefined}
              transition={{ type: "spring", stiffness: 420, damping: 25 }}
              className={`${style.position} ${style.width} ${style.radius} group absolute min-h-[60px] overflow-hidden border border-white/70 bg-[#FFFCF8]/88 px-4 py-2.5 text-left shadow-[0_16px_50px_rgba(30,27,24,0.12)] outline-none backdrop-blur-xl ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Every button breathes between red and green, but none of it tells the truth. */}
              <motion.div
                className="pointer-events-none absolute -inset-12 opacity-75 blur-2xl"
                animate={{
                  background: [
                    "radial-gradient(circle at 22% 30%, rgba(239,68,68,0.38), transparent 47%), radial-gradient(circle at 76% 70%, rgba(16,185,129,0.14), transparent 42%)",
                    "radial-gradient(circle at 18% 34%, rgba(16,185,129,0.36), transparent 46%), radial-gradient(circle at 82% 66%, rgba(239,68,68,0.17), transparent 42%)",
                    "radial-gradient(circle at 50% 10%, rgba(251,191,36,0.24), transparent 40%), radial-gradient(circle at 30% 80%, rgba(239,68,68,0.25), transparent 44%), radial-gradient(circle at 84% 72%, rgba(16,185,129,0.22), transparent 40%)",
                  ],
                }}
                transition={{ duration: 1.35 + index * 0.27, delay: style.delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
              />

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.84),transparent_48%)]" />
              <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80" />

              <motion.div
                className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ${style.dot}`}
                animate={{ opacity: [0.35, 1, 0.35], scale: isSelected ? 1.55 : [1, 1.28, 1] }}
                transition={{ duration: 1.05 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative pl-5 pr-6">
                <div className="line-clamp-1 text-[15px] font-black lowercase leading-tight text-[#1E1B18] md:text-[16px]">
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
                animate={{ x: isHovered ? 1 : -4, opacity: isHovered || isSelected ? 1 : 0.36 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl leading-none text-[#6F685F]"
              >
                →
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
