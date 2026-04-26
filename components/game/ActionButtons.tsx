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
  const rotations = ["-rotate-[0.6deg]", "rotate-[0.2deg]", "rotate-[0.6deg]"];
  const delays = ["0ms", "120ms", "240ms"];

  return (
    <div className="relative z-20 w-full max-w-[1040px] mx-auto -mt-20">
     <div className="grid grid-cols-3 items-start gap-12">
        {choices.map((choice, i) => {
          const isActive =
            hoveredChoiceId === choice.id || selectedChoiceId === choice.id;

          return (
            <button
              key={`choice-slot-${i}`}
              disabled={disabled}
              onClick={() => onSelect(choice)}
              onMouseEnter={() => onHoverChange?.(choice.id)}
              onMouseLeave={() => onHoverChange?.(null)}
              className={clsx(
                "relative mx-auto mt-6 overflow-visible px-7 py-5 w-[250px]",
                "text-center select-none",
                "border border-white/70 shadow-lg backdrop-blur-md",
                "transition-transform transition-shadow duration-500 ease-out",
                "hover:scale-[1.055] active:scale-[0.965]",
                disabled && "pointer-events-none opacity-70",
                rotations[i % 3],
                isActive && "scale-[1.045] shadow-xl"
              )}
              style={{
                borderRadius: "34px 28px 38px 26px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82))",
                animation: "thoughtFloat 3.8s ease-in-out infinite",
                animationDelay: delays[i % 3],
                willChange: "transform",
              }}
            >
              <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
                <div className="thought-bubble-glow" />
              </div>

              <div className="absolute inset-0 rounded-[inherit] pointer-events-none border border-white/60" />

              <div
                key={choice.id}
                className="relative z-10 animate-[choiceTextSwap_260ms_ease-out]"
              >
                <div className="text-[17px] font-extrabold leading-tight text-zinc-900 drop-shadow-sm">
                  {choice.label}
                </div>

                {choice.whisper && (
                  <div className="text-[12px] font-semibold text-zinc-500 mt-1">
                    {choice.whisper}
                  </div>
                )}
              </div>

              <div className="absolute -top-[58px] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <span className="thought-dot thought-dot-lg" />
                <span className="thought-dot thought-dot-md" />
                <span className="thought-dot thought-dot-sm" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}