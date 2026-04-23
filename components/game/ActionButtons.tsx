"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // -----------------------------
  // 🧠 PRESSURE
  // -----------------------------
  const urgency = useMemo(() => {
    if (!choiceWindowMs) return 0;
    return 1 - timeLeftMs / choiceWindowMs;
  }, [timeLeftMs, choiceWindowMs]);

  const pressureLevel = useMemo(() => {
    if (urgency < 0.6) return "calm";
    if (urgency < 0.85) return "tense";
    return "panic";
  }, [urgency]);

  // -----------------------------
  // 🧹 CLEANUP
  // -----------------------------
  useEffect(() => {
    if (disabled) setConfirmingId(null);
  }, [disabled]);

  useEffect(() => {
    if (!confirmingId) return;
    if (!choices.some((c) => c.id === confirmingId)) {
      setConfirmingId(null);
    }
  }, [choices, confirmingId]);

  // -----------------------------
  // 🎯 MOTION
  // -----------------------------
  const shake = pressureLevel === "panic" ? (Math.random() - 0.5) * 2 : 0;

  const scale =
    pressureLevel === "panic"
      ? 1.02
      : pressureLevel === "tense"
      ? 1.01
      : 1;

  const border =
    pressureLevel === "panic"
      ? "border-red-400"
      : pressureLevel === "tense"
      ? "border-amber-400"
      : "border-[#DDD7CE]";

  // -----------------------------
  // 🧱 RENDER
  // -----------------------------
  return (
    <div className="space-y-4">
      {choices.map((choice) => {
        const isHovered = hoveredChoiceId === choice.id;
        const isConfirming = confirmingId === choice.id;
        const isSelected = selectedChoiceId === choice.id;

        return (
          <div key={choice.id} className="relative">

            <motion.button
              type="button"
              layout
              initial={false}
              animate={{
                y: isHovered && !isConfirming && !disabled ? -4 : 0,
                scale,
                x: shake,
              }}
              whileTap={!disabled && !isConfirming ? { scale: 0.96 } : undefined}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 22,
              }}
              onMouseEnter={() => {
                if (disabled) return;
                onHoverChange(choice.id);
              }}
              onMouseLeave={() => {
                if (disabled) return;
                onHoverChange(null);
              }}
              onClick={() => {
                if (disabled) return;
                setConfirmingId((c) =>
                  c === choice.id ? null : choice.id
                );
              }}
              className={[
                "w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200",
                border,
                disabled
                  ? "bg-[#ECE8E2] opacity-60"
                  : isHovered
                  ? "bg-white shadow-lg"
                  : "bg-[#F2EEE9]",
                isSelected ? "ring-1 ring-black/10" : "",
              ].join(" ")}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[15px] font-medium text-[#2A2723]">
                    {choice.label}
                  </div>

                  {choice.whisper && (
                    <div className="text-xs text-[#8A8278] mt-1">
                      {choice.whisper}
                    </div>
                  )}
                </div>

                <motion.span
                  animate={{
                    opacity: isHovered ? 1 : 0.4,
                    x: isHovered ? 0 : -4,
                  }}
                  className="text-xs text-[#6F685F]"
                >
                  →
                </motion.span>
              </div>
            </motion.button>

            {/* CONFIRM */}
            <AnimatePresence>
              {isConfirming && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute inset-0 rounded-2xl bg-white/95 border border-black shadow-lg flex justify-between items-center px-4"
                >
                  <div>
                    <div className="text-sm font-medium">
                      you sure?
                    </div>
                    {choice.whisper && (
                      <div className="text-[11px] text-[#8A8278]">
                        {choice.whisper}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="px-3 py-1.5 text-xs border rounded-md"
                    >
                      no
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(null);
                        onSelect(choice);
                      }}
                      className="px-3 py-1.5 text-xs bg-black text-white rounded-md"
                    >
                      yes
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        );
      })}
    </div>
  );
}