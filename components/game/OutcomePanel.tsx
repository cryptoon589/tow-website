"use client";

import { AnimatePresence, motion } from "framer-motion";

type Outcome = {
  kind: string;
  headline?: string;
  subtext?: string;
  delta: number;
  autoPicked?: boolean;
  currentWinStreak?: number;
  bestWinStreak?: number;
  streakBroken?: number;
  newBestWinStreak?: boolean;
};

type Props = {
  outcome: Outcome | null;
  visible: boolean;
  gameOver?: boolean;
};

function getFallbackCopy(kind: string) {
  const map: Record<string, { title: string; sub: string }> = {
    win: { title: "CLEAN", sub: "that actually worked" },
    winSmall: { title: "NOT BAD", sub: "we'll take that" },
    lose: { title: "TOUGH SCENE", sub: "you walked into that" },
    loseSmall: { title: "OFF", sub: "something felt wrong there" },
    rekt: { title: "BRUTAL", sub: "full conviction. wrong coin" },
    glitch: { title: "???", sub: "market doing market things" },
  };
  return map[kind] || { title: "…", sub: "hard to explain that one" };
}

function getStreakTag(outcome: Outcome) {
  const streak = outcome.currentWinStreak ?? 0;
  if ((outcome.kind === "win" || outcome.kind === "winSmall") && streak >= 6) return { label: `UNREAL HEATER x${streak}`, tone: "good" as const };
  if ((outcome.kind === "win" || outcome.kind === "winSmall") && streak >= 3) return { label: `HEATER x${streak}`, tone: "good" as const };
  if ((outcome.kind === "win" || outcome.kind === "winSmall") && streak === 2) return { label: "BACK-TO-BACK", tone: "good" as const };
  if ((outcome.kind === "lose" || outcome.kind === "loseSmall" || outcome.kind === "rekt") && (outcome.streakBroken ?? 0) >= 3) {
    return { label: `STREAK SNAPPED x${outcome.streakBroken}`, tone: "bad" as const };
  }
  return null;
}

function getDynamicSubtext(outcome: Outcome, base: string) {
  const streak = outcome.currentWinStreak ?? 0;
  if (outcome.kind === "win" || outcome.kind === "winSmall") {
    if (outcome.newBestWinStreak && streak >= 3) return "New heater. Don’t get cocky.";
    if (streak >= 6) return "This feels illegal. It won’t last.";
    if (streak >= 4) return "You’re on a heater. Be careful.";
    if (streak === 3) return "Okay now you're cooking.";
    if (streak === 2) return "Back-to-back. Suspicious.";
  }
  if (outcome.kind === "rekt" && (outcome.streakBroken ?? 0) >= 3) return "Heater gone. Full donation.";
  if ((outcome.kind === "lose" || outcome.kind === "loseSmall") && (outcome.streakBroken ?? 0) >= 3) return "That heater ended exactly how heaters end.";
  if (outcome.autoPicked) return "Too slow. Market picked for you.";
  return base;
}

export default function OutcomePanel({ outcome, visible, gameOver = false }: Props) {
  if (!outcome) return null;

  const fallback = getFallbackCopy(outcome.kind);
  const title = outcome.headline?.trim() || fallback.title;
  const baseSub = outcome.subtext?.trim() || fallback.sub;
  const sub = getDynamicSubtext(outcome, baseSub);
  const delta = outcome.delta ?? 0;
  const isBad = delta > 0;
  const isGood = delta < 0;
  const streakTag = getStreakTag(outcome);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="flex justify-center"
        >
          <div
            className={[
              "relative w-full max-w-[430px] overflow-visible rounded-[30px] border px-5 py-4 shadow-[0_20px_60px_rgba(30,27,24,0.12)] backdrop-blur-xl",
              isBad ? "bg-[#FFF4F4]/92 border-[#F1C5C5]" : isGood ? "bg-[#F4FAF4]/92 border-[#CFE7CF]" : "bg-[#F7F5F2]/92 border-[#DDD7CE]",
            ].join(" ")}
          >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <div
                className={[
                  "grid h-11 w-11 place-items-center rounded-2xl border bg-white/62 text-lg font-black",
                  isBad ? "border-red-200 text-red-500" : isGood ? "border-green-200 text-green-600" : "border-[#DDD7CE] text-[#6F685F]",
                ].join(" ")}
              >
                {isBad ? "↓" : isGood ? "↑" : "?"}
              </div>

              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">outcome</div>
                <div
                  className={[
                    "truncate text-xl font-black uppercase leading-none md:text-2xl",
                    isBad ? "text-red-600" : isGood ? "text-green-700" : "text-[#2A2723]",
                  ].join(" ")}
                >
                  {title}
                </div>
                <div className="mt-1 line-clamp-2 text-sm font-semibold text-[#6F685F]">{sub}</div>
              </div>

              {delta !== 0 && (
                <div
                  className={[
                    "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-black shadow-sm",
                    isBad ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700",
                  ].join(" ")}
                >
                  {isBad ? `+${delta}` : `${delta}`} tired
                </div>
              )}
            </div>

            {(streakTag || outcome.autoPicked || gameOver) && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {streakTag && (
                  <div className={["rounded-full border px-3 py-1 text-[10px] font-black tracking-wide", streakTag.tone === "bad" ? "bg-red-50 border-red-200 text-red-600" : "bg-green-50 border-green-200 text-green-700"].join(" ")}>{streakTag.label}</div>
                )}
                {outcome.autoPicked && <div className="rounded-full border border-[#DDD7CE] bg-[#F1EEE8] px-3 py-1 text-[10px] font-black tracking-wide text-[#6F685F]">AUTO-PICKED</div>}
                {gameOver && <div className="rounded-full border border-[#DDD7CE] bg-white/50 px-3 py-1 text-[10px] font-black tracking-wide text-[#8A8278]">RUN OVER</div>}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
