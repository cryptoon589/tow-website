"use client";

import clsx from "clsx";

export default function TiredMeter({
  tired,
  max,
}: {
  tired: number;
  max: number;
}) {
  const percent = Math.min(100, (tired / max) * 100);

  const segments = 32;
  const activeSegments = Math.round((percent / 100) * segments);

  const state =
    percent < 30
      ? "calm"
      : percent < 60
      ? "stressed"
      : percent < 85
      ? "exhausted"
      : "rekt";

  const toneClass =
    percent < 30
      ? "text-[#1F1B17]"
      : percent < 60
      ? "text-[#F59E0B]"
      : percent < 85
      ? "text-orange-600"
      : "text-red-600";

  const activeColor =
    percent < 30
      ? "bg-[#1F1B17]"
      : percent < 60
      ? "bg-[#F59E0B]"
      : percent < 85
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="w-full max-w-[620px] mx-auto">
      <div
        className={clsx(
          "flex items-center justify-between px-3 mb-1.5 text-[14px] font-black tracking-tight transition-colors duration-300",
          toneClass
        )}
      >
        <span>{state}</span>
        <span>{Math.round(percent)}%</span>
      </div>

      <div className="relative w-full h-6 rounded-full overflow-hidden bg-[#EDE7DF] shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="absolute inset-0 flex items-center px-1.5 gap-[2px]">
          {Array.from({ length: segments }).map((_, i) => {
            const active = i < activeSegments;
            const speed = Math.max(0.65, 1.8 - percent / 90);
            const delay = `${((i * 7) % 13) * 0.07}s`;
            const pulseScale = active ? 0.85 + ((i * 5) % 7) * 0.04 : 1;

            return (
              <div
                key={i}
                className={clsx(
                  "flex-1 rounded-full transition-all duration-300",
                  active ? activeColor : "bg-[#D8D1C7]/75",
                  active
                    ? percent >= 85
                      ? "h-[10px] animate-[meterBlockPulse_0.72s_ease-in-out_infinite]"
                      : percent >= 60
                      ? "h-[9px] animate-[meterBlockPulse_0.95s_ease-in-out_infinite]"
                      : "h-[8px] animate-[meterBlockPulse_1.25s_ease-in-out_infinite]"
                    : "h-[5px]"
                )}
                style={{
                  animation: active
                    ? `meterBlockPulse ${speed}s ease-in-out infinite`
                    : undefined,
                    animationDelay: delay,
                    transform: active ? `scaleY(${pulseScale})` : undefined,
                    transformOrigin: "center",
                  }}
              />
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <div className="h-full w-[35%] bg-white/35 blur-md animate-[meterGlowSweep_2.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
