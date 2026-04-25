"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const CHOICE_WINDOW_MS = 7200;

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getCharacterState(state: GameState): string {
  if (state.gameOver) return "react-rekt";
  if (state.phase === "committed") return "thinking";

  const kind = state.lastOutcome?.kind;
  if (state.phase === "resolving" && kind) return `react-${kind}`;

  if (state.tired >= 82) return "idle-lookaway";
  if (state.memory.winStreak >= 3) return "idle-lookaway";
  return "idle";
}

function getRunBeat(state: GameState, timeLeftMs: number) {
  const kind = state.lastOutcome?.kind;

  if (state.gameOver) return "timeline cooked";
  if (state.phase === "committed") return "checking phone...";
  if (state.phase === "resolving" && kind === "glitch") return "timeline forked";
  if (state.phase === "resolving" && kind === "rekt") return "oh no";
  if (state.phase === "resolving" && (kind === "win" || kind === "winSmall")) return "somehow alive";
  if (state.phase === "resolving") return "market reacted";
  if (timeLeftMs < 1400) return "pick before it picks for you";
  if (state.memory.almostSaves >= 1) return "you should be gone";
  if (state.memory.winStreak >= 3) return "heater forming";
  if (state.tired >= 82) return "survive this";
  return "don’t overthink it";
}

function createSoundEngine() {
  let ctx: AudioContext | null = null;

  const getCtx = () => {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!ctx) ctx = new AudioContextClass();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const tone = (freq: number, duration = 0.08, gain = 0.025, type: OscillatorType = "sine", delayTime = 0) => {
    const audio = getCtx();
    if (!audio) return;

    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = 0;

    osc.connect(amp);
    amp.connect(audio.destination);

    const now = audio.currentTime + delayTime;
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  const noise = (duration = 0.08, gain = 0.02) => {
    const audio = getCtx();
    if (!audio) return;

    const buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.7;

    const source = audio.createBufferSource();
    const amp = audio.createGain();
    source.buffer = buffer;
    amp.gain.value = gain;
    source.connect(amp);
    amp.connect(audio.destination);
    source.start();
  };

  return {
    tap() {
      tone(220, 0.045, 0.018, "square");
      tone(440, 0.04, 0.01, "sine", 0.035);
    },
    tension() {
      tone(164, 0.11, 0.012, "triangle");
    },
    win(big = false) {
      tone(392, 0.07, 0.022, "sine");
      tone(big ? 659 : 523, 0.09, 0.024, "sine", 0.055);
      tone(big ? 784 : 659, 0.11, 0.02, "sine", 0.12);
    },
    lose() {
      tone(196, 0.09, 0.022, "sawtooth");
      tone(123, 0.13, 0.018, "triangle", 0.075);
    },
    rekt() {
      noise(0.13, 0.025);
      tone(92, 0.22, 0.03, "sawtooth");
    },
    glitch() {
      noise(0.08, 0.018);
      tone(311, 0.045, 0.02, "square");
      tone(147, 0.06, 0.018, "square", 0.05);
    },
    gameOver() {
      tone(196, 0.12, 0.025, "triangle");
      tone(147, 0.18, 0.022, "triangle", 0.13);
      tone(98, 0.22, 0.02, "triangle", 0.28);
    },
  };
}

function playOutcomeSound(sound: ReturnType<typeof createSoundEngine>, kind: OutcomeKind) {
  if (kind === "win" || kind === "winSmall") sound.win(kind === "win");
  else if (kind === "rekt") sound.rekt();
  else if (kind === "glitch") sound.glitch();
  else sound.lose();
}

export default function PlayPage() {
  const [bestRun, setBestRun] = useState(0);
  const [state, setState] = useState<GameState>(() => beginChoosing(createInitialState(0)));
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(CHOICE_WINDOW_MS);
  const [showOutcome, setShowOutcome] = useState(false);

  const flowRef = useRef(false);
  const stateRef = useRef(state);
  const soundRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);

  if (!soundRef.current && typeof window !== "undefined") {
    soundRef.current = createSoundEngine();
  }

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const market = useMemo(() => getMarketState(state), [state]);
  const characterState = useMemo(() => getCharacterState(state), [state]);
  const runBeat = useMemo(() => getRunBeat(state, timeLeftMs), [state, timeLeftMs]);

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

  const playChoiceFlow = useCallback(async (choice: Choice, wasAutoPicked = false) => {
    const current = stateRef.current;
    const sound = soundRef.current;
    if (flowRef.current || current.gameOver || current.phase !== "choosing") return;

    flowRef.current = true;
    setHoveredChoiceId(null);
    setShowOutcome(false);
    sound?.tap();

    const committed = commitChoice(current, choice.id, wasAutoPicked);
    stateRef.current = committed;
    setState(committed);

    await delay(130 + Math.random() * 160);
    sound?.tension();

    // Addiction beat: tiny hesitation/fake-out before the reveal.
    if (Math.random() < 0.34 || current.tired >= 80) {
      await delay(170 + Math.random() * 260);
    }

    const resolved = resolveChoice(committed, choice.id, wasAutoPicked);
    stateRef.current = resolved.state;
    setState(resolved.state);

    // Micro blink before payoff. Makes outcome feel like it hit, not like text changed.
    setShowOutcome(false);
    await delay(60);
    setShowOutcome(true);
    playOutcomeSound(sound ?? createSoundEngine(), resolved.outcome.kind);

    const kind = resolved.outcome.kind as OutcomeKind;
    const almost = ["BARELY ALIVE", "ONE HP", "ALMOST REKT", "CLUTCH SAVE", "ONE TAP LEFT", "NOT DEAD YET", "HANGING ON"].includes(resolved.outcome.headline);
    const hold = kind === "rekt" || kind === "glitch" || almost ? 1380 : 850 + Math.random() * 360;
    await delay(hold);

    if (resolved.state.gameOver) {
      sound?.gameOver();
      flowRef.current = false;
      return;
    }

    setShowOutcome(false);
    await delay(110 + Math.random() * 150);

    const next = beginChoosing(advanceAfterResolve(resolved.state));
    stateRef.current = next;
    setState(next);
    setTimeLeftMs(CHOICE_WINDOW_MS);
    flowRef.current = false;
  }, []);

  useEffect(() => {
    if (state.phase !== "choosing" || state.gameOver || timeLeftMs > 0 || flowRef.current) return;

    // Auto-pick now intentionally avoids always picking safe. Panic causes bad clicks.
    const fallbackChoice =
      state.choices[Math.floor(Math.random() * state.choices.length)] || state.choices[0];

    if (fallbackChoice) void playChoiceFlow(fallbackChoice, true);
  }, [timeLeftMs, state, playChoiceFlow]);

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
    <main className="relative h-screen overflow-hidden px-4 pb-2 pt-9 text-[#1E1B18]">
      <SceneLayer state={state} timeLeftMs={timeLeftMs} choiceWindowMs={CHOICE_WINDOW_MS} />

      <header className="absolute left-0 top-0 z-20 flex w-full items-center px-4 py-3 text-sm">
        <Link href="/" className="font-black tracking-tight text-[#1E1B18]">TOW</Link>
      </header>

      <section className="mx-auto flex h-full w-full max-w-[380px] flex-col items-center justify-between gap-0.5">
        <div className="w-full rounded-[22px] border border-[#DDD7CE] bg-[#FFFCF8]/88 p-2.5 shadow-[0_14px_48px_rgba(30,27,24,0.07)] backdrop-blur-xl">
          <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-[#6F685F]">
            <span>turn <strong className="text-[#1E1B18]">{state.turn}</strong></span>
            <span className={market.color}>{market.label}</span>
            <span>{getStreakLabel(state.memory.winStreak)}</span>
          </div>

          <TiredMeter tired={state.tired} max={MAX_TIRED} timeLeftMs={timeLeftMs} choiceWindowMs={CHOICE_WINDOW_MS} />

          <div className="mt-1.5 rounded-full bg-black/[0.035] px-3 py-1 text-center text-[10px] font-black lowercase text-[#6F685F]">
            {runBeat}
          </div>
        </div>

        <div className="relative -my-4 flex w-full shrink-0 justify-center">
          <div className="absolute bottom-7 h-12 w-36 rounded-full bg-black/10 blur-2xl" />
          <TowCharacter state={characterState} timeLeftMs={timeLeftMs} choiceWindowMs={CHOICE_WINDOW_MS} width={245} height={245} />
        </div>

        <OutcomePanel outcome={state.lastOutcome} visible={showOutcome} gameOver={state.gameOver} />

        <div className="w-full pb-0">
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
