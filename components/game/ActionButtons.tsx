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

const THOUGHTS: Record<Choice["category"], string[]> = {
  safe: ["this should be fine", "play it boring", "just survive", "don’t force it"],
  swing: ["eh… run it", "maybe this works", "idk but try", "this feels early"],
  chaos: ["this might be stupid", "send it", "we ball", "last chance alpha"],
};

const RISK_LABEL: Record<Choice["category"], string> = {
  safe: "steady",
  swing: "hmm",
  chaos: "???",
};

function deterministicPick(items: string[], seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return items[hash % items.length];
}

function getCardStyle(category: Choice["category"], index: number) {
  if (category === "chaos") {
    return {
      rotate: index % 2 === 0 ? -0.9 : 0.9,
      shell: "border-red-300/70 bg-[#FFF7F4] shadow-[0_12px_30px_rgba(239,68,68,0.10)]",
      label: "text-red-500",
      glow: "from-red-500/10",
    };
  }

  if (category === "swing") {
    return {
      rotate: index % 2 === 0 ? 0.45 : -0.45,
      shell: "border-amber-300/70 bg-[#FFF9EC] shadow-[0_12px_30px_rgba(245,158,11,0.09)]",
      label: "text-amber-600",
      glow: "from-amber-400/10",
    };
  }

  return {
    rotate: 0,
    shell: "border-[#DDD7CE] bg-[#FFFCF8] shadow-[0_12px_30px_rgba(30,27,24,0.06)]",
    label: "text-[#6F685F]",
    glow: "from-black/[0.035]",
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
  const panic = urgency > 0.84;

  return (
    <div className="space-y-3">
      {choices.map((choice, index) => {
        const isHovered = hoveredChoiceId === choice.id;
        const isSelected = selectedChoiceId === choice.id;
        const style = getCardStyle(choice.category, index);
        const thought = deterministicPick(THOUGHTS[choice.category], choice.id);

        return (
          <motion.button
            key={choice.id}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && onHoverChange(choice.id)}
            onMouseLeave={() => !disabled && onHoverChange(null)}
            onClick={() => !disabled && onSelect(choice)}
            initial={{ opacity: 0, y: 8, rotate: style.rotate }}
            animate={{
              opacity: disabled && !isSelected ? 0.55 : 1,
              y: isHovered && !disabled ? -4 : 0,
              rotate: style.rotate,
              scale: isSelected ? 1.025 : panic && !disabled ? 1.01 : 1,
              x: panic && choice.category === "chaos" && !disabled ? [0, -1, 1, 0] : 0,
            }}
            whileTap={!disabled ? { scale: 0.965 } : undefined}
            transition={{ type: "spring", stiffness: 340, damping: 24 }}
            className={`group relative w-full overflow-hidden rounded-3xl border px-5 py-4 text-left transition ${style.shell} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} to-transparent opacity-100`} />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="text-[15px] font-black lowercase leading-tight text-[#1E1B18]">
                  {thought}
                </div>
                <div className="mt-1 text-xs leading-snug text-[#7A7168]">
                  {choice.label}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${style.label}`}>
                  {RISK_LABEL[choice.category]}
                </span>
                <motion.span
                  animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0.45 }}
                  className="text-lg leading-none text-[#6F685F]"
                >
                  →
                </motion.span>
              </div>
            </div>

            {choice.whisper && (
              <div className="relative mt-2 text-[11px] italic text-[#9A9288]">
                {choice.whisper}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
