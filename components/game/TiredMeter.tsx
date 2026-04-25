"use client";

import { motion } from "framer-motion";

type Props = {
  tired: number;
  max: number;
  timeLeftMs?: number;
  choiceWindowMs?: number;
};

export default function TiredMeter({ tired, max, timeLeftMs = 0, choiceWindowMs = 1 }: Props) {
  const pct = Math.min(100, Math.max(0, (tired / max) * 100));
  const urgency = choiceWindowMs > 0 ? 1 - timeLeftMs / choiceWindowMs : 0;

  const label = pct < 35 ? "chill" : pct < 62 ? "getting tired" : pct < 84 ? "stressed" : pct < 96 ? "exhausted" : "cooked";
  const barColor = pct < 45 ? "bg-[#1E1B18]" : pct < 74 ? "bg-amber-500" : "bg-red-500";
  const danger = pct >= 75 || urgency > 0.82;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-[#6F685F]">
        <span className="font-semibold lowercase">{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#E8E1D7]">
        <motion.div
          animate={{ width: `${pct}%`, opacity: danger ? [1, 0.75, 1] : 1 }}
          transition={{ width: { duration: 0.28 }, opacity: { duration: 0.55, repeat: danger ? Infinity : 0 } }}
          className={`h-full rounded-full ${barColor}`}
        />
        <motion.div
          animate={{ x: `${Math.min(96, pct)}%` }}
          transition={{ duration: 0.28 }}
          className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white/70 shadow"
        />
      </div>
    </div>
  );
}
