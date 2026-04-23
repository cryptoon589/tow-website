"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import SceneLayer from "@/components/game/SceneLayer";
import { motion } from "framer-motion";
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
  resolveChoice,
  restartRun,
  type Choice,
  type GameState,
} from "@/components/game/engine";

const CHOICE_WINDOW_MS = 5500;
const GRACE_MS = 800;
const RESOLVE_HOLD_MS = 1250;

export default function PlayPage() {
  const [bestRun, setBestRun] = useState(0);
  const [gameState, setGameState] = useState<GameState>(createInitialState(0));
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(CHOICE_WINDOW_MS);
  const [graceActive, setGraceActive] = useState(false);
  const [roundStartedAt, setRoundStartedAt] = useState(0);
  const [tappedPulse, setTappedPulse] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);

  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const market = useMemo(() => getMarketState(gameState), [gameState]);

  const hesitationMs = useMemo(() => {
    if (!roundStartedAt) return 0;
    return Date.now() - roundStartedAt;
  }, [roundStartedAt, timeLeftMs, graceActive]);

  const clearTimers = useCallback(() => {
    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    graceTimerRef.current = null;
    resolveTimerRef.current = null;
  }, []);

  const beginTurn = useCallback(() => {
    setGameState((prev) => beginChoosing(prev));
    setHoveredChoiceId(null);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    setGraceActive(true);
    setTappedPulse(false);
    setShowOutcome(false);
    setRoundStartedAt(Date.now());

    graceTimerRef.current = setTimeout(() => {
      setGraceActive(false);
    }, GRACE_MS);
  }, []);

  const persistBestRun = useCallback((turn: number) => {
    setBestRun((prev) => {
      const nextBest = Math.max(prev, turn);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("tow-best-run", String(nextBest));
      }
      return nextBest;
    });
  }, []);

  const finalizeResolve = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver) {
        persistBestRun(prev.turn);
        return prev;
      }
      return advanceAfterResolve(prev);
    });

    resolveTimerRef.current = setTimeout(() => {
      setGameState((prev) => {
        if (prev.gameOver) return prev;
        return prev.phase === "idle" ? beginChoosing(prev) : prev;
      });
      setHoveredChoiceId(null);
      setTimeLeftMs(CHOICE_WINDOW_MS);
      setGraceActive(true);
      setTappedPulse(false);
      setShowOutcome(false);
      setRoundStartedAt(Date.now());

      graceTimerRef.current = setTimeout(() => {
        setGraceActive(false);
      }, GRACE_MS);
    }, 180);
  }, [persistBestRun, beginChoosing]);

  const resolveSelectedChoice = useCallback(
    (choice: Choice, wasAutoPicked: boolean) => {
      setGameState((prev) => {
        const committed = commitChoice(prev, choice.id, wasAutoPicked);
        const { state } = resolveChoice(committed, choice.id, wasAutoPicked);
        return state;
      });

      setShowOutcome(true);

      resolveTimerRef.current = setTimeout(() => {
        finalizeResolve();
      }, RESOLVE_HOLD_MS);
    },
    [finalizeResolve]
  );

  const handleChoiceClick = useCallback(
    (choice: Choice) => {
      if (gameState.phase !== "choosing") return;

      clearTimers();

      setGameState((prev) => commitChoice(prev, choice.id, false));
      setTappedPulse(true);

      window.setTimeout(() => {
        setTappedPulse(false);
      }, 140);

      resolveTimerRef.current = setTimeout(() => {
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

    resolveTimerRef.current = setTimeout(() => {
      resolveSelectedChoice(randomChoice, true);
    }, 420);
  }, [clearTimers, gameState.choices, gameState.phase, resolveSelectedChoice]);

  const restartGame = useCallback(() => {
    clearTimers();
    const next = restartRun(bestRun);
    setGameState(next);
    setHoveredChoiceId(null);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    setGraceActive(false);
    setTappedPulse(false);
    setShowOutcome(false);
    setRoundStartedAt(0);

    window.setTimeout(() => {
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

    return () => clearTimers();
  }, [beginTurn, clearTimers]);

  useEffect(() => {
    if (gameState.phase !== "choosing" || graceActive) return;

    const interval = window.setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 100) {
          window.clearInterval(interval);
          handleAutoPick();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [gameState.phase, graceActive, handleAutoPick]);

  const progressPct = graceActive ? 100 : (timeLeftMs / CHOICE_WINDOW_MS) * 100;

  const characterState = useMemo(
    () => ({
      lastOutcome: gameState.lastOutcome
        ? {
            kind: gameState.lastOutcome.kind,
            mood:
              gameState.lastOutcome.kind === "win" ||
              gameState.lastOutcome.kind === "winSmall"
                ? "win"
                : gameState.lastOutcome.kind === "glitch"
                ? "glitch"
                : gameState.lastOutcome.kind === "rekt"
                ? "rekt"
                : "lose",
            vfx:
              gameState.lastOutcome.kind === "win" ||
              gameState.lastOutcome.kind === "winSmall"
                ? "green"
                : gameState.lastOutcome.kind === "glitch"
                ? "glitch"
                : "red",
          }
        : null,
      phase: gameState.phase,
      isChoosing: gameState.phase === "choosing",
      isResolving: gameState.phase === "resolving",
      isIdle: gameState.phase === "idle",
    }),
    [gameState.lastOutcome, gameState.phase]
  );

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
    {/* ✅ ADD HERE */}
    <SceneLayer
      state={gameState}
      timeLeftMs={timeLeftMs}
      choiceWindowMs={CHOICE_WINDOW_MS}
    />

      <header className="border-b border-[#DDD7CE] bg-[#FFFCF8]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-[#1E1B18] hover:opacity-70 transition"
          >
            TOW
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <div className={`flex items-center gap-2 ${market.color}`}>
              <span>{market.icon}</span>
              <span className="font-medium">{market.label}</span>
            </div>

            <div className="text-[#6F685F]">Turn {gameState.turn}</div>

            <div className="px-3 py-1 rounded-full text-xs font-semibold border border-[#DDD7CE] bg-white text-[#1E1B18]">
              Tired: {Math.round(gameState.tired)}%
            </div>

            <div className="px-3 py-1 rounded-full text-xs font-semibold border border-[#DDD7CE] bg-white text-[#6F685F]">
              Best: {bestRun}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-10">
        <div className="w-full max-w-2xl space-y-6">
          <TiredMeter tired={gameState.tired} max={MAX_TIRED} />

          <div className="flex justify-center py-1">
            <TowCharacter
              state={characterState}
              preAction={gameState.phase === "choosing"}
              hesitationMs={hesitationMs}
              timeLeftMs={timeLeftMs}
              choiceWindowMs={CHOICE_WINDOW_MS}
              tapped={tappedPulse}
              selected={gameState.selectedChoiceId !== null}
              autoPicked={gameState.autoPicked}
              width={360}
              height={360}
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
                <div className="h-2 w-full rounded-full bg-[#E8E1D7] overflow-hidden">
                  <motion.div
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.08, ease: "linear" }}
                    className={`h-full ${
                      progressPct > 35
                        ? "bg-[#1E1B18]"
                        : progressPct > 15
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
                <div className="text-center text-xs text-[#6F685F]">
                  {graceActive ? "Read fast." : "Choose or get auto-picked."}
                </div>
              </div>

              <ActionButtons
                choices={gameState.choices}
                selectedChoiceId={gameState.selectedChoiceId}
                hoveredChoiceId={hoveredChoiceId}
                onHoverChange={setHoveredChoiceId}
                onSelect={handleChoiceClick}
                disabled={gameState.phase !== "choosing"}
              />
            </div>
          )}
        </div>
      </main>

      <GameOverOverlay
        state={gameState}
        bestRun={bestRun}
        onReplay={restartGame}
      />
    </div>
  );
}