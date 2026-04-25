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

  // 🔥 more segments = thinner look
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

  return (
    <div className="w-full max-w-[620px] mx-auto">
      {/* TEXT (pulled inward) */}
      <div className="flex justify-between items-center text-xs px-3 mb-1 opacity-70">
        <span>{state}</span>
        <span>{Math.round(percent)}%</span>
      </div>

      {/* BAR */}
      <div className="relative w-full h-5 bg-[#EDE7DF] rounded-full overflow-hidden">

        {/* SEGMENTS */}
        <div className="absolute inset-0 flex items-center px-1 gap-[2px]">
          {Array.from({ length: segments }).map((_, i) => {
            const active = i < activeSegments;

            return (
              <div
                key={i}
                className={clsx(
                  "h-[6px] flex-1 rounded-full transition-all duration-300",
                  active
                    ? percent < 60
                      ? "bg-[#F59E0B]"
                      : percent < 85
                      ? "bg-orange-500"
                      : "bg-red-500"
                    : "bg-[#D8D1C7]"
                )}
              />
            );
          })}
        </div>

        {/* 🔥 ALWAYS-ON subtle pulse */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 animate-[meterPulse_3s_ease-in-out_infinite]" />
        </div>

        {/* 🔥 shimmer when pressure builds */}
        {percent > 50 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-[-100%] h-full w-[50%] bg-white/20 blur-sm animate-[shimmer_3s_linear_infinite]" />
          </div>
        )}
      </div>
    </div>
  );
}