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
  const danger = pct >= 68 || urgency > 0.78;
  const cooked = pct >= 88;

  const fill =
    pct < 34
      ? "bg-[#1E1B18]"
      : pct < 62
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="relative mx-auto w-full md:w-[min(520px,100%)]">
      <div className="mb-1 flex items-center justify-between text-[9px] font-black lowercase text-[#6F685F]">
        <span>{pct < 40 ? "tired" : pct < 72 ? "stressed" : pct < 90 ? "exhausted" : "cooked"}</span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>

      <motion.div
        animate={{
          scale: danger ? [1, 1.014, 1] : 1,
          rotate: cooked ? [0, -0.12, 0.12, 0] : 0,
        }}
        transition={{ duration: cooked ? 0.34 : 0.65, repeat: danger ? Infinity : 0 }}
        className="relative h-3 w-full overflow-hidden rounded-full bg-[#E8E1D7] shadow-inner md:h-4"
      >
        <motion.div
          animate={{ width: `${pct}%`, opacity: danger ? [1, 0.74, 1] : 1 }}
          transition={{ width: { duration: 0.24 }, opacity: { duration: 0.48, repeat: danger ? Infinity : 0 } }}
          className={`relative h-full overflow-hidden rounded-full ${fill}`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.48),transparent)] animate-[towShimmer_1.18s_linear_infinite]" />
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ opacity: [0.04, 0.22, 0.04] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        </motion.div>

        <motion.div
          animate={{ x: `${Math.min(97, pct)}%` }}
          transition={{ duration: 0.24 }}
          className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white/90 shadow md:h-6"
        />

        {danger && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/20"
            animate={{ opacity: [0, cooked ? 0.62 : 0.44, 0] }}
            transition={{ duration: cooked ? 0.38 : 0.55, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
}
