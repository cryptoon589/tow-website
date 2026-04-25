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
  const fill = pct < 45 ? "bg-[#1E1B18]" : pct < 74 ? "bg-amber-500" : "bg-red-500";
  const danger = pct >= 75 || urgency > 0.82;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-[#6F685F]">
        <span className="font-bold lowercase">{label}</span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>

      <motion.div
        animate={{ scale: danger ? [1, 1.012, 1] : 1 }}
        transition={{ duration: 0.8, repeat: danger ? Infinity : 0 }}
        className="relative h-3 w-full overflow-hidden rounded-full bg-[#E8E1D7] shadow-inner"
      >
        <motion.div
          animate={{ width: `${pct}%`, opacity: danger ? [1, 0.76, 1] : 1 }}
          transition={{ width: { duration: 0.28 }, opacity: { duration: 0.55, repeat: danger ? Infinity : 0 } }}
          className={`relative h-full overflow-hidden rounded-full ${fill}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.34),transparent)] animate-[towShimmer_1.8s_linear_infinite]" />
        </motion.div>

        <motion.div
          animate={{ x: `${Math.min(96, pct)}%` }}
          transition={{ duration: 0.28 }}
          className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-white/80 shadow"
        />

        {danger && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/15"
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
}
