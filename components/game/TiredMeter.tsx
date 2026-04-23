"use client";

import { motion } from "framer-motion";

type Props = {
  tired: number;
  max: number;
};

export default function TiredMeter({ tired, max }: Props) {
  const pct = Math.min(100, (tired / max) * 100);

  // -----------------------------
  // 🎨 COLOR STATES
  // -----------------------------
  const isLow = pct < 40;
  const isMid = pct >= 40 && pct < 70;
  const isHigh = pct >= 70;

  const barColor = isLow
    ? "bg-black"
    : isMid
    ? "bg-amber-500"
    : "bg-red-500";

  const label = isLow
    ? "focused"
    : isMid
    ? "getting tired"
    : "exhausted";

  // -----------------------------
  // ⚡ DANGER PULSE
  // -----------------------------
  const pulse = isHigh ? 1.02 : 1;

  // -----------------------------
  // 🧱 RENDER
  // -----------------------------
  return (
    <div className="w-full space-y-2">

      {/* HEADER */}
      <div className="flex justify-between text-xs text-[#6F685F]">
        <span>Tired</span>
        <span>{Math.round(pct)}%</span>
      </div>

      {/* BAR */}
      <div className="h-3 w-full bg-[#E8E1D7] rounded-full overflow-hidden">
        <motion.div
          animate={{
            width: `${pct}%`,
            scale: pulse,
          }}
          transition={{
            width: { duration: 0.25 },
            scale: {
              duration: 0.5,
              repeat: isHigh ? Infinity : 0,
              repeatType: "mirror",
            },
          }}
          className={`h-full ${barColor}`}
        />
      </div>

      {/* LABEL */}
      <div className="text-center text-[11px] text-[#8A8278]">
        {label}
      </div>
    </div>
  );
}