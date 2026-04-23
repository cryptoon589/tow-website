"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import SceneLayer from "@/components/game/SceneLayer";
import ActionButtons from "@/components/game/ActionButtons";
import TiredMeter from "@/components/game/TiredMeter";
import TowCharacter from "@/components/game/TowCharacter";
import OutcomePanel from "@/components/game/OutcomePanel";
import GameOverOverlay from "@/components/game/GameOverOverlay";

import {
  MAX_TIRED,
  advanceAfterResolve,
  beginChoosing,
  commitChoice,
  createInitialState,
  getMarketState,
  getStreakLabel,
  resolveChoice,
  restartRun,
  type Choice,
  type GameState,
} from "@/components/game/engine";

const CHOICE_WINDOW_MS = 5500;
const RESOLVE_HOLD_MS = 1400;
const GRACE_MS = 800;

export default function PlayPage() {
  const [bestRun, setBestRun] = useState(0);
  const [gameState, setGameState] = useState<GameState>(createInitialState(0));
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(CHOICE_WINDOW_MS);
  const [graceActive, setGraceActive] = useState(true);
  const [showOutcome, setShowOutcome] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const market = useMemo(() => getMarketState(gameState), [gameState]);

  const streak = gameState.memory.winStreak;
  const bestStreak = gameState.memory.bestWinStreak;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (resolveRef.current) clearTimeout(resolveRef.current);
    if (graceRef.current) clearTimeout(graceRef.current);
    timerRef.current = null;
    resolveRef.current = null;
    graceRef.current = null;
  }, []);

  const persistBestRun = useCallback((turn: number) => {
    setBestRun((prev) => {
      const next = Math.max(prev, turn);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("tow-best-run", String(next));
      }
      return next;
    });
  }, []);

  const beginTurn = useCallback(() => {
    clearTimers();

    setGameState((prev) => beginChoosing(prev));
    setHoveredChoiceId(null);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    setGraceActive(true);
    setShowOutcome(false);

    graceRef.current = setTimeout(() => {
      setGraceActive(false);
    }, GRACE_MS);
  }, [clearTimers]);

  const finalizeRound = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver) {
        persistBestRun(prev.turn);
        return prev;
      }
      return advanceAfterResolve(prev);
    });

    resolveRef.current = setTimeout(() => {
      setGameState((prev) => {
        if (prev.gameOver) return prev;
        return beginChoosing(prev);
      });

      setHoveredChoiceId(null);
      setTimeLeftMs(CHOICE_WINDOW_MS);
      setGraceActive(true);
      setShowOutcome(false);

      graceRef.current = setTimeout(() => {
        setGraceActive(false);
      }, GRACE_MS);
    }, 180);
  }, [persistBestRun]);

  const resolveSelectedChoice = useCallback(
    (choice: Choice, auto = false) => {
      setGameState((prev) => {
        const committed = commitChoice(prev, choice.id, auto);
        const { state } = resolveChoice(committed, choice.id, auto);
        return state;
      });

      setShowOutcome(true);

      resolveRef.current = setTimeout(() => {
        finalizeRound();
      }, RESOLVE_HOLD_MS);
    },
    [finalizeRound]
  );

  const handleChoiceClick = useCallback(
    (choice: Choice) => {
      if (gameState.phase !== "choosing") return;
      clearTimers();

      setGameState((prev) => commitChoice(prev, choice.id, false));

      resolveRef.current = setTimeout(() => {
        resolveSelectedChoice(choice, false);
      }, 320);
    },
    [clearTimers, gameState.phase, resolveSelectedChoice]
  );

  const handleAutoPick = useCallback(() => {
    if (gameState.phase !== "choosing" || gameState.choices.length === 0) return;

    const randomChoice =
      gameState.choices[Math.floor(Math.random() * gameState.choices.length)];

    clearTimers();

    setGameState((prev) => commitChoice(prev, randomChoice.id, true));

    resolveRef.current = setTimeout(() => {
      resolveSelectedChoice(randomChoice, true);
    }, 420);
  }, [clearTimers, gameState.choices, gameState.phase, resolveSelectedChoice]);

  const handleReplay = useCallback(() => {
    clearTimers();
    const next = restartRun(bestRun);
    setGameState(next);
    setHoveredChoiceId(null);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    setGraceActive(true);
    setShowOutcome(false);

    resolveRef.current = setTimeout(() => {
      beginTurn();
    }, 120);
  }, [beginTurn, bestRun, clearTimers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBest = Number(window.localStorage.getItem("tow-best-run") ?? "0");
      if (!Number.isNaN(savedBest)) {
        setBestRun(savedBest);
        setGameState(createInitialState(savedBest));
      }
    }

    beginTurn();

    return () => {
      clearTimers();
    };
  }, [beginTurn, clearTimers]);

  useEffect(() => {
    if (gameState.phase !== "choosing" || graceActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          handleAutoPick();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [gameState.phase, graceActive, handleAutoPick]);

  const characterState = useMemo(() => {
    if (showOutcome && gameState.lastOutcome) {
      const k = gameState.lastOutcome.kind;

      if (k === "win") return "react-win";
      if (k === "winSmall") return "react-winSmall";
      if (k === "lose") return "react-lose";
      if (k === "loseSmall") return "react-loseSmall";
      if (k === "rekt") return "react-rekt";
      if (k === "glitch") return "react-glitch";
    }

    if (gameState.phase === "committed") {
      return "thinking";
    }

    if (gameState.phase === "choosing" && !graceActive && timeLeftMs < 1200) {
      return "idle-lookaway";
    }

    return "idle-neutral";
  }, [gameState, showOutcome, graceActive, timeLeftMs]);

  const progressPct = Math.max(0, Math.min(100, (timeLeftMs / CHOICE_WINDOW_MS) * 100));

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      <SceneLayer
        state={gameState}
        timeLeftMs={timeLeftMs}
        choiceWindowMs={CHOICE_WINDOW_MS}
      />

      <header className="border-b border-[#DDD7CE] bg-[#FFFCF8] z-10 relative">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
          <Link
            href="/"
            className="font-bold text-lg text-[#1E1B18] hover:opacity-70 transition"
          >
            TOW
          </Link>

          <div className="flex gap-2 md:gap-3 text-sm flex-wrap justify-end items-center">
            <div className={`${market.color} font-medium`}>
              {market.icon} {market.label}
            </div>

            <div className="text-[#6F685F]">Turn {gameState.turn}</div>

            <div className="px-3 py-1 rounded-full text-xs font-semibold border border-[#DDD7CE] bg-white text-[#1E1B18]">
              Heat x{streak}
            </div>

            <div className="px-3 py-1 rounded-full text-xs font-semibold border border-[#DDD7CE] bg-white text-[#6F685F]">
              Best Heat {bestStreak}
            </div>

            <div className="px-3 py-1 rounded-full text-xs font-semibold border border-[#DDD7CE] bg-white text-[#6F685F]">
              Best Run {bestRun}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <TiredMeter tired={gameState.tired} max={MAX_TIRED} />

          <div className="text-center text-xs text-[#6F685F]">
            {streak > 0 ? `${getStreakLabel(streak)} • x${streak}` : "Cold start"}
          </div>

          <div className="flex justify-center">
            <TowCharacter
              state={characterState}
              timeLeftMs={timeLeftMs}
              choiceWindowMs={CHOICE_WINDOW_MS}
              width={340}
              height={340}
            />
          </div>

          <OutcomePanel
            outcome={gameState.lastOutcome}
            visible={showOutcome}
            gameOver={gameState.gameOver}
          />

          {gameState.phase === "choosing" && !gameState.gameOver && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-2 bg-[#E8E1D7] rounded overflow-hidden">
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.08, ease: "linear" }}
                    className={`h-full ${
                      progressPct > 35
                        ? "bg-black"
                        : progressPct > 15
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>

                <div className="text-center text-xs text-[#6F685F]">
                  {graceActive
                    ? "Read fast."
                    : streak >= 3
                    ? "Heater alive. Don’t blow it."
                    : "Choose or get auto-picked."}
                </div>
              </div>

              <ActionButtons
                choices={gameState.choices}
                selectedChoiceId={gameState.selectedChoiceId}
                hoveredChoiceId={hoveredChoiceId}
                onHoverChange={setHoveredChoiceId}
                onSelect={handleChoiceClick}
                disabled={gameState.phase !== "choosing"}
                timeLeftMs={timeLeftMs}
                choiceWindowMs={CHOICE_WINDOW_MS}
              />
            </div>
          )}
        </div>
      </main>

      <GameOverOverlay
        state={gameState}
        bestRun={bestRun}
        onReplay={handleReplay}
      />
    </div>
  );
}