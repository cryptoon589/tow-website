"use client";

import clsx from "clsx";
import type { Choice } from "@/components/game/engine";

export default function ActionButtons({
  choices,
  selectedChoiceId,
  hoveredChoiceId,
  onHoverChange,
  onSelect,
  disabled,
}: {
  choices: Choice[];
  selectedChoiceId?: string | null;
  hoveredChoiceId?: string | null;
  onHoverChange?: (id: string | null) => void;
  onSelect: (choice: Choice) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative w-full max-w-[640px] mx-auto h-[160px] -mt-4">
      {choices.map((choice, i) => {
        const positions = [
          "left-[2%] top-[8%]",
          "right-[2%] top-[10%]",
          "left-[34%] bottom-[0%]",
        ];

        const rotation = ["-rotate-[0.5deg]", "rotate-[0.5deg]", "-rotate-[0.25deg]"];

        const isActive =
          hoveredChoiceId === choice.id ||
          selectedChoiceId === choice.id;

        return (
          <button
            key={choice.id}
            disabled={disabled}
            onClick={() => onSelect(choice)}
            onMouseEnter={() => onHoverChange?.(choice.id)}
            onMouseLeave={() => onHoverChange?.(null)}
            className={clsx(
              "absolute px-7 py-6 min-w-[190px] max-w-[230px]",
              "text-center",
              "transition-all duration-200",
              "hover:scale-[1.03] active:scale-[0.97]",
              "shadow-md",
              "border border-white/40",
              "backdrop-blur-md",
              positions[i % 3],
              rotation[i % 3],
              isActive ? "scale-[1.04]" : ""
            )}
            style={{
              borderRadius: "32px 28px 36px 26px", // 🔥 organic bubble shape
              background: `
                linear-gradient(
                  120deg,
                  rgba(34,197,94,0.28),
                  rgba(255,255,255,0.85),
                  rgba(239,68,68,0.28)
                )
              `,
            }}
          >
            {/* inner pulse (subtle but visible) */}
            <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
              <div className="absolute inset-0 animate-[bubblePulse_3s_ease-in-out_infinite]" />
            </div>

            {/* content */}
            <div className="relative z-10">
              <div className="text-[16px] font-semibold leading-tight">
                {choice.label}
              </div>

              {choice.whisper && (
                <div className="text-[12px] opacity-60 mt-1">
                  {choice.whisper}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}