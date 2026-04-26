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
  const rotations = ["-rotate-[0.45deg]", "rotate-[0.15deg]", "rotate-[0.45deg]"];
  const delays = ["0ms", "140ms", "280ms"];

  return (
    <div className="relative z-20 mx-auto w-full max-w-[860px]">
      <div className="grid w-full grid-cols-3 items-start gap-8">
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
                "relative mx-auto h-[86px] w-[260px] overflow-visible px-7 py-4",
                "select-none text-center",
                "border border-white/70 shadow-lg backdrop-blur-md",
                "transition-[transform,box-shadow,opacity] duration-500 ease-out",
                "hover:scale-[1.045] hover:shadow-xl active:scale-[0.965]",
                disabled && "pointer-events-none opacity-70",
                rotations[i % 3],
                isActive && "scale-[1.035] shadow-xl"
              )}
              style={{
                borderRadius: "34px 28px 38px 26px",
                background:
                  "linear-gradient(135deg, rgba(230,255,242,0.92), rgba(255,232,232,0.92))",
                animation: "thoughtFloat 3.8s ease-in-out infinite",
                animationDelay: delays[i % 3],
                willChange: "transform",
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <div className="thought-bubble-glow" />
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/60" />

              <div
                key={choice.id}
                className="relative z-10 animate-[choiceTextSwap_260ms_ease-out]"
              >
                <div className="text-[17px] font-extrabold leading-tight text-zinc-900 drop-shadow-sm">
                  {choice.label}
                </div>

                {choice.whisper && (
                  <div className="mt-1 text-[12px] font-semibold text-zinc-500">
                    {choice.whisper}
                  </div>
                )}
              </div>

              <div className="pointer-events-none absolute -top-[56px] left-1/2 z-30 -translate-x-1/2">
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