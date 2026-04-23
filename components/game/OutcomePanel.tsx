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

// -----------------------------
// 🧠 FALLBACK COPY
// -----------------------------
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

// -----------------------------
// 🔥 STREAK TAG
// -----------------------------
function getStreakTag(outcome: Outcome) {
  const streak = outcome.currentWinStreak ?? 0;

  if ((outcome.kind === "win" || outcome.kind === "winSmall") && streak >= 6) {
    return { label: `UNREAL HEATER x${streak}`, tone: "good" as const };
  }

  if ((outcome.kind === "win" || outcome.kind === "winSmall") && streak >= 3) {
    return { label: `HEATER x${streak}`, tone: "good" as const };
  }

  if ((outcome.kind === "win" || outcome.kind === "winSmall") && streak === 2) {
    return { label: "BACK-TO-BACK", tone: "good" as const };
  }

  if (
    (outcome.kind === "lose" ||
      outcome.kind === "loseSmall" ||
      outcome.kind === "rekt") &&
    (outcome.streakBroken ?? 0) >= 3
  ) {
    return {
      label: `STREAK SNAPPED x${outcome.streakBroken}`,
      tone: "bad" as const,
    };
  }

  return null;
}

// -----------------------------
// 🎯 DYNAMIC SUBTEXT
// -----------------------------
function getDynamicSubtext(outcome: Outcome, base: string) {
  const streak = outcome.currentWinStreak ?? 0;

  if (outcome.kind === "win" || outcome.kind === "winSmall") {
    if (outcome.newBestWinStreak && streak >= 3) {
      return "New heater. Don’t get cocky.";
    }
    if (streak >= 6) {
      return "This feels illegal. It won’t last.";
    }
    if (streak >= 4) {
      return "You’re on a heater. Be careful.";
    }
    if (streak === 3) {
      return "Okay now you're cooking.";
    }
    if (streak === 2) {
      return "Back-to-back. Suspicious.";
    }
  }

  if (outcome.kind === "rekt" && (outcome.streakBroken ?? 0) >= 3) {
    return "Heater gone. Full donation.";
  }

  if (
    (outcome.kind === "lose" || outcome.kind === "loseSmall") &&
    (outcome.streakBroken ?? 0) >= 3
  ) {
    return "That heater ended exactly how heaters end.";
  }

  if (outcome.autoPicked) {
    return "Too slow. Market picked for you.";
  }

  return base;
}

// -----------------------------
// 🎭 COMPONENT
// -----------------------------
export default function OutcomePanel({
  outcome,
  visible,
  gameOver = false,
}: Props) {
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
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="flex justify-center"
        >
          <div
            className={[
              "w-full max-w-md rounded-2xl px-6 py-5 border shadow-sm",
              isBad
                ? "bg-[#FFF4F4] border-[#F1C5C5]"
                : isGood
                ? "bg-[#F4FAF4] border-[#CFE7CF]"
                : "bg-[#F7F5F2] border-[#DDD7CE]",
            ].join(" ")}
          >
            {/* TITLE */}
            <div className="text-center space-y-1">
              <div
                className={[
                  "text-lg font-bold tracking-wide",
                  isBad
                    ? "text-red-600"
                    : isGood
                    ? "text-green-700"
                    : "text-[#2A2723]",
                ].join(" ")}
              >
                {title}
              </div>

              <div className="text-sm text-[#6F685F]">{sub}</div>
            </div>

            {/* TAGS */}
            {(streakTag || outcome.autoPicked) && (
              <div className="mt-4 flex justify-center gap-2 flex-wrap">

                {streakTag && (
                  <div
                    className={[
                      "text-[11px] px-3 py-1 rounded-full border font-semibold tracking-wide",
                      streakTag.tone === "bad"
                        ? "bg-red-50 border-red-200 text-red-600"
                        : "bg-green-50 border-green-200 text-green-700",
                    ].join(" ")}
                  >
                    {streakTag.label}
                  </div>
                )}

                {outcome.autoPicked && (
                  <div className="text-[11px] px-3 py-1 rounded-full border font-semibold tracking-wide bg-[#F1EEE8] border-[#DDD7CE] text-[#6F685F]">
                    AUTO-PICKED
                  </div>
                )}

              </div>
            )}

            {/* DELTA */}
            {delta !== 0 && (
              <div className="mt-4 flex justify-center">
                <div
                  className={[
                    "text-xs px-3 py-1 rounded-full border",
                    isBad
                      ? "bg-red-50 border-red-200 text-red-600"
                      : "bg-green-50 border-green-200 text-green-700",
                  ].join(" ")}
                >
                  {isBad ? `+${delta} tired` : `${delta} tired`}
                </div>
              </div>
            )}

            {/* GAME OVER */}
            {gameOver && (
              <div className="mt-3 text-center text-xs text-[#8A8278]">
                that run is over
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}