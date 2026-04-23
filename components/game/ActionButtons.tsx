"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Choice } from "@/components/game/engine";

type ActionButtonsProps = {
  choices: Choice[];
  selectedChoiceId: string | null;
  hoveredChoiceId: string | null;
  onHoverChange: (id: string | null) => void;
  onSelect: (choice: Choice) => void;
  disabled?: boolean;
};

export function ActionButtons({
  choices,
  selectedChoiceId,
  hoveredChoiceId,
  onHoverChange,
  onSelect,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="grid gap-3">
      {choices.map((choice, index) => {
        const isSelected = selectedChoiceId === choice.id;
        const isDimmed =
          selectedChoiceId !== null && selectedChoiceId !== choice.id;
        const showWhisper = hoveredChoiceId === choice.id || isSelected;

        return (
          <motion.button
            key={choice.id}
            type="button"
            onClick={() => onSelect(choice)}
            onHoverStart={() => onHoverChange(choice.id)}
            onHoverEnd={() => onHoverChange(null)}
            onFocus={() => onHoverChange(choice.id)}
            onBlur={() => onHoverChange(null)}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isDimmed ? 0.45 : 1,
              y: [0, -2, 0],
              scale: isSelected ? 1.02 : 1,
            }}
            transition={{
              opacity: { duration: 0.16 },
              scale: { duration: 0.14 },
              y: {
                duration: 2.8 + index * 0.35,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              },
            }}
            whileHover={disabled ? undefined : { scale: 1.025, y: -2 }}
            whileTap={disabled ? undefined : { scale: 0.985 }}
            disabled={disabled}
            className={[
              "rounded-2xl border border-[#DDD7CE] bg-[#FFFCF8] px-4 py-4 text-left shadow-sm transition",
              disabled ? "cursor-default" : "cursor-pointer",
            ].join(" ")}
          >
            <div className="text-base md:text-lg font-semibold text-[#1E1B18]">
              {choice.label}
            </div>

            <AnimatePresence>
              {showWhisper && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mt-1 text-xs text-[#8A8278]"
                >
                  {choice.whisper}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

export default ActionButtons;