"use client";

import { motion } from "framer-motion";

type TiredMeterProps = {
  tired: number;
  max?: number;
};

export function TiredMeter({ tired, max = 100 }: TiredMeterProps) {
  const pct = Math.max(0, Math.min(100, (tired / max) * 100));

  const getColor = () => {
    if (pct < 35) return "bg-[#1E1B18]"; // stable
    if (pct < 70) return "bg-amber-500"; // unstable
    return "bg-red-500"; // panic
  };

  const getLabel = () => {
    if (pct < 35) return "stable";
    if (pct < 70) return "unstable";
    return "panic";
  };

  return (
    <div className="space-y-2">
      {/* BAR */}
      <div className="h-4 w-full rounded-full bg-[#E8E1D7] overflow-hidden border border-[#DDD7CE]">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          className={`h-full ${getColor()}`}
        />
      </div>

      {/* LABEL ROW */}
      <div className="flex justify-between text-xs text-[#6F685F]">
        <span>{getLabel()}</span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

export default TiredMeter;