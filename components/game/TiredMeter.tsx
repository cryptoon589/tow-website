"use client";

import { motion } from "framer-motion";

type Props = {
  tired: number;
  max: number;
  timeLeftMs?: number;
  choiceWindowMs?: number;
};

const SEGMENTS = 18;

export default function TiredMeter({ tired, max, timeLeftMs = 0, choiceWindowMs = 1 }: Props) {
  const pct = Math.min(100, Math.max(0, (tired / max) * 100));
  const urgency = choiceWindowMs > 0 ? 1 - timeLeftMs / choiceWindowMs : 0;
  const danger = pct >= 68 || urgency > 0.78;
  const cooked = pct >= 88;
  const mood = pct < 36 ? "tired" : pct < 68 ? "stressed" : pct < 88 ? "exhausted" : "cooked";

  return (
    <div className="relative mx-auto w-full md:w-[min(620px,100%)]">
      <div className="mb-1.5 flex items-center justify-between px-2 text-[10px] font-black lowercase text-[#6F685F] md:px-3">
        <span>{mood}</span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>

      <motion.div
        animate={{
          scale: danger ? [1, 1.014, 1] : 1,
          rotate: cooked ? [0, -0.1, 0.1, 0] : 0,
        }}
        transition={{ duration: cooked ? 0.34 : 0.72, repeat: danger ? Infinity : 0 }}
        className="relative h-[24px] w-full overflow-hidden rounded-full bg-[#E8E1D7] shadow-[inset_0_2px_8px_rgba(30,27,24,0.11)] md:h-[28px]"
      >
        <div className="absolute inset-0 flex gap-[3px] p-[4px]">
          {Array.from({ length: SEGMENTS }).map((_, index) => {
            const active = ((index + 1) / SEGMENTS) * 100 <= pct;
            const hot = pct >= 68;
            const mid = pct >= 36;
            return (
              <motion.div
                key={index}
                animate={{
                  opacity: active ? (danger ? [0.86, 1, 0.78] : 1) : 0.16,
                  height: active ? [`${48 + ((index * 17) % 38)}%`, `${72 + ((index * 11) % 26)}%`, `${48 + ((index * 17) % 38)}%`] : "34%",
                }}
                transition={{ duration: 0.95 + index * 0.025, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                className={[
                  "mt-auto flex-1 rounded-full",
                  active && hot ? "bg-red-500" : active && mid ? "bg-amber-500" : active ? "bg-[#1E1B18]" : "bg-[#CFC6BA]",
                ].join(" ")}
              />
            );
          })}
        </div>

        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.55),transparent)]"
          animate={{ x: ["-120%", "340%"] }}
          transition={{ duration: danger ? 0.85 : 1.65, repeat: Infinity, ease: "linear" }}
        />

        {danger && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20"
            animate={{ opacity: [0, cooked ? 0.62 : 0.4, 0] }}
            transition={{ duration: cooked ? 0.38 : 0.6, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
}
