"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import ActionButtons from "@/components/game/ActionButtons";
import GameOverOverlay from "@/components/game/GameOverOverlay";
import OutcomePanel from "@/components/game/OutcomePanel";
import SceneLayer from "@/components/game/SceneLayer";
import TiredMeter from "@/components/game/TiredMeter";
import TowCharacter from "@/components/game/TowCharacter";

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
  type OutcomeKind,
} from "@/components/game/engine";

const CHOICE_WINDOW_MS = 9000;

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getCharacterState(state: GameState): string {
  if (state.gameOver) return "react-rekt";
  if (state.phase === "committed") return "thinking";

  const kind = state.lastOutcome?.kind;
  if (state.phase === "resolving" && kind) return `react-${kind}`;

  if (state.memory.winStreak >= 3) return "idle-lookaway";
  return "idle";
}

function getRunBeat(state: GameState) {
  const kind = state.lastOutcome?.kind;

  if (state.gameOver) return "timeline cooked";
  if (state.phase === "committed") return "checking phone...";
  if (state.phase === "resolving" && kind === "glitch") return "timeline forked";
  if (state.phase === "resolving" && kind === "rekt") return "oh no";
  if (state.phase === "resolving" && (kind === "win" || kind === "winSmall")) return "somehow alive";
  if (state.phase === "resolving") return "market reacted";
  if (state.memory.winStreak >= 3) return "heater forming";
  if (state.tired >= 82) return "survive this";
  return "don’t overthink it";
}

export default function PlayPage() {
  const [bestRun, setBestRun] = useState(0);
  const [state, setState] = useState<GameState>(() => beginChoosing(createInitialState(0)));
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(CHOICE_WINDOW_MS);
  const [showOutcome, setShowOutcome] = useState(false);

  const flowRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const market = useMemo(() => getMarketState(state), [state]);
  const characterState = useMemo(() => getCharacterState(state), [state]);
  const runBeat = useMemo(() => getRunBeat(state), [state]);

  useEffect(() => {
    setBestRun((current) => Math.max(current, state.turn));
  }, [state.turn]);

  useEffect(() => {
    if (state.phase !== "choosing" || state.gameOver) return;

    const startedAt = Date.now();
    setTimeLeftMs(CHOICE_WINDOW_MS);

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(0, CHOICE_WINDOW_MS - elapsed);
      setTimeLeftMs(next);
      if (next <= 0) window.clearInterval(interval);
    }, 100);

    return () => window.clearInterval(interval);
  }, [state.turn, state.phase, state.gameOver]);

  const playChoiceFlow = async (choice: Choice, wasAutoPicked = false) => {
    const current = stateRef.current;
    if (flowRef.current || current.gameOver || current.phase !== "choosing") return;

    flowRef.current = true;
    setHoveredChoiceId(null);
    setShowOutcome(false);

    const committed = commitChoice(current, choice.id, wasAutoPicked);
    stateRef.current = committed;
    setState(committed);

    await delay(140 + Math.random() * 180);

    // tension beat / fake-out
    if (Math.random() < 0.28) await delay(180 + Math.random() * 240);

    const resolved = resolveChoice(committed, choice.id, wasAutoPicked);
    stateRef.current = resolved.state;
    setState(resolved.state);
    setShowOutcome(true);

    const kind = resolved.outcome.kind as OutcomeKind;
    const hold = kind === "rekt" || kind === "glitch" ? 1350 : 920 + Math.random() * 430;
    await delay(hold);

    if (resolved.state.gameOver) {
      flowRef.current = false;
      return;
    }

    setShowOutcome(false);
    await delay(120 + Math.random() * 160);

    const next = beginChoosing(advanceAfterResolve(resolved.state));
    stateRef.current = next;
    setState(next);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    flowRef.current = false;
  };

  useEffect(() => {
    if (state.phase !== "choosing" || state.gameOver || timeLeftMs > 0 || flowRef.current) return;

    const fallbackChoice =
      state.choices.find((choice) => choice.category === "safe") || state.choices[0];

    if (fallbackChoice) void playChoiceFlow(fallbackChoice, true);
  }, [timeLeftMs, state]);

  const handleReplay = () => {
    flowRef.current = false;
    setShowOutcome(false);
    setHoveredChoiceId(null);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    const fresh = beginChoosing(restartRun(bestRun));
    stateRef.current = fresh;
    setState(fresh);
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-[#1E1B18]">
      <SceneLayer state={state} timeLeftMs={timeLeftMs} choiceWindowMs={CHOICE_WINDOW_MS} />

      <section className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-md flex-col items-center justify-center gap-3">
        <div className="w-full rounded-[28px] border border-[#DDD7CE] bg-[#FFFCF8]/90 p-4 shadow-[0_18px_60px_rgba(30,27,24,0.08)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#6F685F]">
            <span>turn <strong className="text-[#1E1B18]">{state.turn}</strong></span>
            <span className={market.color}>{market.icon} {market.label}</span>
            <span>{getStreakLabel(state.memory.winStreak)}</span>
          </div>

          <TiredMeter tired={state.tired} max={MAX_TIRED} timeLeftMs={timeLeftMs} choiceWindowMs={CHOICE_WINDOW_MS} />

          <div className="mt-3 rounded-2xl bg-black/[0.035] px-3 py-2 text-center text-xs font-medium text-[#6F685F]">
            {runBeat}
          </div>
        </div>

        <div className="relative -my-3 flex w-full justify-center">
          <div className="absolute bottom-8 h-16 w-44 rounded-full bg-black/10 blur-2xl" />
          <TowCharacter state={characterState} timeLeftMs={timeLeftMs} choiceWindowMs={CHOICE_WINDOW_MS} width={330} height={330} />
        </div>

        <OutcomePanel outcome={state.lastOutcome} visible={showOutcome} gameOver={state.gameOver} />

        <div className="w-full">
          <ActionButtons
            choices={state.choices}
            selectedChoiceId={state.selectedChoiceId}
            hoveredChoiceId={hoveredChoiceId}
            onHoverChange={setHoveredChoiceId}
            onSelect={(choice) => void playChoiceFlow(choice)}
            disabled={state.phase !== "choosing" || state.gameOver}
            timeLeftMs={timeLeftMs}
            choiceWindowMs={CHOICE_WINDOW_MS}
          />
        </div>
      </section>

      <GameOverOverlay state={state} bestRun={bestRun} onReplay={handleReplay} />
    </main>
  );
}
