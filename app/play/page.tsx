"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getRewardProfile, submitLeaderboardScore } from "@/lib/towLeaderboard";

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
  createFreshProfile,
  createInitialState,
  getMarketState,
  getPersonaLine,
  getRunArc,
  mergeProfileWithRun,
  resolveChoice,
  restartRun,
  type Choice,
  type GameState,
  type OutcomeKind,
  type PlayerProfile,
} from "@/components/game/engine";

const MIN_CHOICE_WINDOW_MS = 10800;
const MAX_CHOICE_WINDOW_MS = 13600;
const PROFILE_KEY = "tow-player-memory-v1";

type SfxKey =
  | "click"
  | "tick"
  | "tension"
  | "win"
  | "winSmall"
  | "closeCall"
  | "lose"
  | "rekt"
  | "glitch"
  | "gameOver"
  | "tiredUp"
  | "tiredDown";

type VisualFxKind =
  | "tap"
  | "win"
  | "lose"
  | "rekt"
  | "glitch"
  | "closeCall"
  | "gameOver";

type VisualFx = {
  id: number;
  kind: VisualFxKind;
  label: string;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getChoiceWindowMs(choices: Choice[]) {
  const longest = choices.reduce((max, choice) => {
    return Math.max(max, choice.label.length + choice.whisper.length);
  }, 0);

  return Math.min(
    MAX_CHOICE_WINDOW_MS,
    MIN_CHOICE_WINDOW_MS + Math.max(0, longest - 26) * 80
  );
}

function getCharacterState(state: GameState): string {
  if (state.gameOver) return "react-rekt";
  if (state.phase === "committed") return "thinking";

  const kind = state.lastOutcome?.kind;
  if (state.phase === "resolving" && kind) return `react-${kind}`;

  if (state.tired >= 88) return "idle-stress";
  if (state.tired >= 72) return "idle-lookaway";
  if (state.memory.winStreak >= 3) return "idle-lookaway";

  return "idle";
}

function getRunBeat(
  state: GameState,
  timeLeftMs: number,
  choiceWindowMs: number,
  persona: PlayerProfile["persona"]
) {
  const arc = getRunArc(state);
  const kind = state.lastOutcome?.kind;

  if (state.gameOver) return `${arc.title}: timeline cooked`;
  if (state.phase === "committed") return "checking phone...";
  if (state.phase === "resolving" && kind === "glitch") return "timeline forked";
  if (state.phase === "resolving" && kind === "rekt") return "oh no";
  if (state.phase === "resolving" && (kind === "win" || kind === "winSmall"))
    return "somehow alive";
  if (state.phase === "resolving") return "market reacted";
  if (timeLeftMs < 2600) return "pick before it picks for you";
  if (state.memory.almostSaves >= 1) return "you should be gone";
  if (state.memory.winStreak >= 3) return "heater forming";
  if (state.tired >= 82) return "survive this";
  if (choiceWindowMs - timeLeftMs < 1200) return arc.title;
  if (persona !== "fresh" && state.turn <= 3) return getPersonaLine(persona);

  return arc.line;
}

function isCloseCallHeadline(headline = "") {
  return [
    "BARELY ALIVE",
    "ONE HP",
    "ALMOST REKT",
    "CLUTCH SAVE",
    "ONE TAP LEFT",
    "NOT DEAD YET",
    "HANGING ON",
  ].includes(headline);
}

function getOutcomeFx(kind: OutcomeKind, headline = ""): VisualFx {
  if (isCloseCallHeadline(headline)) {
    return {
      id: Date.now(),
      kind: "closeCall",
      label: headline || "BARELY ALIVE",
    };
  }

  if (kind === "win" || kind === "winSmall") {
    return {
      id: Date.now(),
      kind: "win",
      label: kind === "win" ? "WE MOVE" : "STILL HERE",
    };
  }

  if (kind === "rekt") {
    return {
      id: Date.now(),
      kind: "rekt",
      label: "REKT",
    };
  }

  if (kind === "glitch") {
    return {
      id: Date.now(),
      kind: "glitch",
      label: "GLITCH",
    };
  }

  return {
    id: Date.now(),
    kind: "lose",
    label: "COOKED",
  };
}

function createProceduralFallback() {
  let ctx: AudioContext | null = null;
  let lastTick = 0;
  let lastTiredShift = 0;

  const getCtx = () => {
    if (typeof window === "undefined") return null;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return null;
    if (!ctx) ctx = new AudioContextClass();
    if (ctx.state === "suspended") void ctx.resume();

    return ctx;
  };

  const tone = (
    freq: number,
    duration = 0.08,
    gain = 0.026,
    type: OscillatorType = "sine",
    delayTime = 0,
    endFreq?: number
  ) => {
    const audio = getCtx();
    if (!audio) return;

    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const filter = audio.createBiquadFilter();
    const now = audio.currentTime + delayTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, endFreq),
        now + duration
      );
    }

    filter.type = "lowpass";
    filter.frequency.value =
      type === "sawtooth" || type === "square" ? 1450 : 2600;

    amp.gain.value = 0;

    osc.connect(filter);
    filter.connect(amp);
    amp.connect(audio.destination);

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  };

  const noise = (duration = 0.08, gain = 0.026, delayTime = 0) => {
    const audio = getCtx();
    if (!audio) return;

    const buffer = audio.createBuffer(
      1,
      Math.max(1, Math.floor(audio.sampleRate * duration)),
      audio.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.55;
    }

    const source = audio.createBufferSource();
    const amp = audio.createGain();
    const filter = audio.createBiquadFilter();
    const now = audio.currentTime + delayTime;

    filter.type = "bandpass";
    filter.frequency.value = 780;
    amp.gain.value = gain;

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(audio.destination);

    source.start(now);
    source.stop(now + duration);
  };

  return {
    click() {
      tone(190, 0.04, 0.024, "triangle", 0, 120);
      tone(420, 0.03, 0.016, "sine", 0.025);
    },

    tick(msLeft: number) {
      const now = Date.now();
      if (now - lastTick < 430) return;

      lastTick = now;

      if (msLeft < 1000) {
        tone(920, 0.03, 0.034, "square", 0, 640);
        return;
      }

      tone(msLeft < 2200 ? 760 : 540, 0.026, 0.022, "square");
    },

    tension() {
      tone(110, 0.1, 0.024, "triangle", 0, 150);
      tone(176, 0.08, 0.018, "sine", 0.07, 220);
    },

    tiredShift(delta: number) {
      const now = Date.now();
      if (now - lastTiredShift < 260) return;

      lastTiredShift = now;

      if (delta > 0) {
        tone(155, 0.08, 0.03, "sawtooth", 0, 95);
        tone(82, 0.1, 0.02, "triangle", 0.04);
      } else if (delta < 0) {
        tone(330, 0.06, 0.026, "sine");
        tone(495, 0.09, 0.022, "triangle", 0.045);
      }
    },

    win(big = false) {
      tone(392, 0.08, 0.032, "sine");
      tone(big ? 659 : 523, 0.1, 0.034, "triangle", 0.06);
      tone(big ? 880 : 659, 0.13, 0.028, "sine", 0.14);
    },

    closeCall() {
      tone(260, 0.055, 0.03, "sawtooth", 0, 180);
      tone(340, 0.055, 0.026, "triangle", 0.055);
      tone(220, 0.12, 0.024, "sine", 0.13);
    },

    lose() {
      tone(170, 0.1, 0.035, "square", 0, 115);
      tone(95, 0.17, 0.027, "triangle", 0.08);
    },

    rekt() {
      noise(0.15, 0.035);
      tone(90, 0.2, 0.044, "sawtooth", 0, 55);
      tone(55, 0.26, 0.03, "square", 0.08);
    },

    glitch() {
      noise(0.08, 0.036);
      tone(740, 0.03, 0.03, "square");
      tone(420, 0.03, 0.028, "sawtooth", 0.035);
      tone(980, 0.025, 0.024, "square", 0.07);
    },

    gameOver() {
      tone(220, 0.13, 0.034, "triangle", 0, 180);
      tone(150, 0.15, 0.03, "triangle", 0.13, 110);
      tone(95, 0.26, 0.025, "sine", 0.28, 60);
    },
  };
}

function createGameAudioEngine() {
  const fallback = createProceduralFallback();

  let mainLoop: HTMLAudioElement | null = null;
  let currentRate = 1;
  let targetRate = 1;

  const sfxPaths: Record<SfxKey, string> = {
    click: "/audio/sfx-click.mp3",
    tick: "/audio/sfx-tick.mp3",
    tension: "/audio/sfx-tension.mp3",
    win: "/audio/sfx-win.mp3",
    winSmall: "/audio/sfx-win-small.mp3",
    closeCall: "/audio/sfx-closecall.mp3",
    lose: "/audio/sfx-lose.mp3",
    rekt: "/audio/sfx-rekt.mp3",
    glitch: "/audio/sfx-glitch.mp3",
    gameOver: "/audio/sfx-gameover.mp3",
    tiredUp: "/audio/sfx-tired-up.mp3",
    tiredDown: "/audio/sfx-tired-down.mp3",
  };

  const sfxVolume: Record<SfxKey, number> = {
    click: 0.3,
    tick: 0.13,
    tension: 0.18,
    win: 0.38,
    winSmall: 0.32,
    closeCall: 0.36,
    lose: 0.38,
    rekt: 0.44,
    glitch: 0.4,
    gameOver: 0.44,
    tiredUp: 0.22,
    tiredDown: 0.2,
  };

  const sfx: Partial<Record<SfxKey, HTMLAudioElement>> = {};
  const unavailable: Partial<Record<SfxKey, boolean>> = {};

  const ensure = () => {
    if (typeof window === "undefined") return;

    if (!mainLoop) {
      mainLoop = new Audio("/audio/tired-loop.mp3");
      mainLoop.loop = true;
      mainLoop.volume = 0.075;
      mainLoop.playbackRate = 1;
      mainLoop.preload = "auto";
    }

    (Object.keys(sfxPaths) as SfxKey[]).forEach((key) => {
      if (sfx[key]) return;

      const audio = new Audio(sfxPaths[key]);
      audio.preload = "auto";
      audio.volume = sfxVolume[key];
      audio.onerror = () => {
        unavailable[key] = true;
      };

      sfx[key] = audio;
    });
  };

  const safePlay = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    void audio.play().catch(() => {});
  };

  const playSfx = (key: SfxKey, fallbackPlay: () => void) => {
    ensure();

    const base = sfx[key];

    if (!base || unavailable[key]) {
      fallbackPlay();
      return;
    }

    const sound = base.cloneNode(true) as HTMLAudioElement;
    sound.volume = sfxVolume[key];

    void sound.play().catch(() => {
      unavailable[key] = true;
      fallbackPlay();
    });
  };

  return {
    start() {
      ensure();
      safePlay(mainLoop);
    },

    updateMusic(tired: number, timeLeftMs: number, choiceWindowMs: number) {
      ensure();

      if (!mainLoop) return;

      const tiredPressure = Math.max(0, Math.min(1, tired / MAX_TIRED));
      const urgency = 1 - timeLeftMs / Math.max(1, choiceWindowMs);
      const combinedPressure = Math.max(tiredPressure, urgency * 0.32);

      targetRate = 0.96 + combinedPressure * 0.1;
      currentRate += (targetRate - currentRate) * 0.055;

      mainLoop.playbackRate = currentRate;
      mainLoop.volume = 0.068 + combinedPressure * 0.012;
    },

    stop() {
      if (!mainLoop) return;
      mainLoop.pause();
      mainLoop.currentTime = 0;
      currentRate = 1;
      targetRate = 1;
    },

    click() {
      playSfx("click", () => fallback.click());
    },

    tick(msLeft: number) {
      playSfx("tick", () => fallback.tick(msLeft));
    },

    tension() {
      playSfx("tension", () => fallback.tension());
    },

    tiredShift(delta: number) {
      playSfx(delta > 0 ? "tiredUp" : "tiredDown", () =>
        fallback.tiredShift(delta)
      );
    },

    win(big = false) {
      playSfx(big ? "win" : "winSmall", () => fallback.win(big));
    },

    closeCall() {
      playSfx("closeCall", () => fallback.closeCall());
    },

    lose() {
      playSfx("lose", () => fallback.lose());
    },

    rekt() {
      playSfx("rekt", () => fallback.rekt());
    },

    glitch() {
      playSfx("glitch", () => fallback.glitch());
    },

    gameOver() {
      playSfx("gameOver", () => fallback.gameOver());
    },
  };
}

function playOutcomeSound(
  sound: ReturnType<typeof createGameAudioEngine>,
  kind: OutcomeKind,
  headline = ""
) {
  const closeCall = isCloseCallHeadline(headline);

  if (closeCall) sound.closeCall();
  else if (kind === "win" || kind === "winSmall") sound.win(kind === "win");
  else if (kind === "rekt") sound.rekt();
  else if (kind === "glitch") sound.glitch();
  else sound.lose();
}

function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") return createFreshProfile();

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return createFreshProfile();
    return { ...createFreshProfile(), ...JSON.parse(raw) } as PlayerProfile;
  } catch {
    return createFreshProfile();
  }
}

function saveProfile(profile: PlayerProfile) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage may be unavailable; gameplay should continue.
  }
}

export default function PlayPage() {
  const [profile, setProfile] = useState<PlayerProfile>(() =>
    createFreshProfile()
  );
  const [bestRun, setBestRun] = useState(0);
  const [state, setState] = useState<GameState>(() =>
    beginChoosing(createInitialState(0))
  );
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [choiceWindowMs, setChoiceWindowMs] = useState(() =>
    getChoiceWindowMs(state.choices)
  );
  const [timeLeftMs, setTimeLeftMs] = useState(choiceWindowMs);
  const [showOutcome, setShowOutcome] = useState(false);
  const [visualFx, setVisualFx] = useState<VisualFx | null>(null);

  const [gameMode, setGameMode] = useState<"fun" | "earn">("fun");
  const [rewardUsername, setRewardUsername] = useState<string | null>(null);

  const isRewardRun = gameMode === "earn" && Boolean(rewardUsername);

  const flowRef = useRef(false);
  const gameOverSavedRef = useRef(false);
  const stateRef = useRef(state);
  const profileRef = useRef(profile);
  const soundRef = useRef<ReturnType<typeof createGameAudioEngine> | null>(
    null
  );
  const previousTiredRef = useRef(state.tired);
  const visualFxTimeoutRef = useRef<number | null>(null);

  if (!soundRef.current && typeof window !== "undefined") {
    soundRef.current = createGameAudioEngine();
  }

  const triggerVisualFx = useCallback((kind: VisualFxKind, label: string) => {
    const id = Date.now() + Math.random();

    if (visualFxTimeoutRef.current) {
      window.clearTimeout(visualFxTimeoutRef.current);
    }

    setVisualFx({ id, kind, label });

    visualFxTimeoutRef.current = window.setTimeout(() => {
      setVisualFx((current) => (current?.id === id ? null : current));
    }, kind === "tap" ? 360 : 760);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextMode = params.get("mode") === "earn" ? "earn" : "fun";
    const rewardProfile = getRewardProfile();

    setGameMode(nextMode);
    setRewardUsername(
      nextMode === "earn" && rewardProfile ? rewardProfile.xUsername : null
    );
  }, []);

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    profileRef.current = stored;
    setBestRun(stored.bestRun);
  }, []);

  useEffect(() => {
    stateRef.current = state;

    soundRef.current?.updateMusic(state.tired, timeLeftMs, choiceWindowMs);
  }, [state, timeLeftMs, choiceWindowMs]);

  useEffect(() => {
    const previous = previousTiredRef.current;
    const delta = state.tired - previous;

    if (Math.abs(delta) >= 3 && state.phase === "resolving") {
      soundRef.current?.tiredShift(delta);
    }

    previousTiredRef.current = state.tired;
  }, [state.tired, state.phase]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    return () => {
      soundRef.current?.stop();

      if (visualFxTimeoutRef.current) {
        window.clearTimeout(visualFxTimeoutRef.current);
      }
    };
  }, []);

  const market = useMemo(() => getMarketState(state), [state]);
  const characterState = useMemo(() => getCharacterState(state), [state]);
  const runArc = useMemo(() => getRunArc(state), [state]);

  const runBeat = useMemo(
    () => getRunBeat(state, timeLeftMs, choiceWindowMs, profile.persona),
    [state, timeLeftMs, choiceWindowMs, profile.persona]
  );

  const screenFxClass =
    visualFx?.kind === "rekt" || visualFx?.kind === "gameOver"
      ? "tow-screen-rekt"
      : visualFx?.kind === "glitch"
      ? "tow-screen-glitch"
      : visualFx?.kind === "lose"
      ? "tow-screen-lose"
      : visualFx?.kind === "closeCall"
      ? "tow-screen-close"
      : visualFx?.kind === "win"
      ? "tow-screen-win"
      : "";

  useEffect(() => {
    setBestRun((current) => Math.max(current, state.turn));
  }, [state.turn]);

  useEffect(() => {
    if (state.phase !== "choosing" || state.gameOver) return;

    const nextWindow = getChoiceWindowMs(state.choices);
    setChoiceWindowMs(nextWindow);
    setTimeLeftMs(nextWindow);

    const startedAt = Date.now();
    const graceMs = 400;

    const interval = window.setInterval(() => {
      const elapsed = Math.max(0, Date.now() - startedAt - graceMs);
      const next = Math.max(0, nextWindow - elapsed);

      setTimeLeftMs(next);

      const currentState = stateRef.current;

      soundRef.current?.updateMusic(currentState.tired, next, nextWindow);

      if (next < 3100 && next > 0) soundRef.current?.tick(next);
      if (next <= 0) window.clearInterval(interval);
    }, 100);

    return () => window.clearInterval(interval);
  }, [state.turn, state.phase, state.gameOver, state.choices]);

  useEffect(() => {
    if (!state.gameOver || gameOverSavedRef.current) return;

    gameOverSavedRef.current = true;

    const currentProfile = profileRef.current;
    const next = mergeProfileWithRun(currentProfile, state);

    setProfile(next);
    profileRef.current = next;
    saveProfile(next);
    setBestRun((current) => Math.max(current, next.bestRun, state.turn));

    if (isRewardRun) {
      void submitLeaderboardScore(state.turn);
    }
  }, [isRewardRun, state]);

  const playChoiceFlow = useCallback(
    async (choice: Choice, wasAutoPicked = false) => {
      const current = stateRef.current;
      const sound = soundRef.current;

      if (flowRef.current || current.gameOver || current.phase !== "choosing")
        return;

      flowRef.current = true;
      setHoveredChoiceId(null);
      setShowOutcome(false);
      sound?.start();
      sound?.click();
      triggerVisualFx("tap", "tap");

      const elapsedRatio = 1 - timeLeftMs / Math.max(1, choiceWindowMs);
      const hesitationPressure = wasAutoPicked
        ? 1
        : Math.max(0, Math.min(1, elapsedRatio));

      const committed = commitChoice(current, choice.id, wasAutoPicked);
      stateRef.current = committed;
      setState(committed);

      await delay(180 + Math.random() * 180);
      sound?.tension();

      if (
        Math.random() < 0.38 ||
        current.tired >= 72 ||
        hesitationPressure > 0.65
      ) {
        await delay(220 + Math.random() * 320);
      }

      const resolved = resolveChoice(
        committed,
        choice.id,
        wasAutoPicked,
        hesitationPressure,
        profileRef.current.persona
      );

      stateRef.current = resolved.state;
      setState(resolved.state);

      setShowOutcome(false);
      await delay(90);
      setShowOutcome(true);

      if (sound) {
        playOutcomeSound(
          sound,
          resolved.outcome.kind,
          resolved.outcome.headline
        );
      }

      const outcomeFx = getOutcomeFx(
        resolved.outcome.kind,
        resolved.outcome.headline
      );
      triggerVisualFx(outcomeFx.kind, outcomeFx.label);

      const kind = resolved.outcome.kind as OutcomeKind;
      const almost = isCloseCallHeadline(resolved.outcome.headline);

      const hold =
        kind === "rekt" || kind === "glitch" || almost
          ? 2100
          : 1650 + Math.random() * 520;

      await delay(hold);

      if (resolved.state.gameOver) {
        sound?.gameOver();
        triggerVisualFx("gameOver", "TIRED OUT");
        flowRef.current = false;
        return;
      }

      setShowOutcome(false);
      await delay(160 + Math.random() * 180);

      const next = beginChoosing(advanceAfterResolve(resolved.state));
      stateRef.current = next;
      gameOverSavedRef.current = false;
      setState(next);

      const nextWindow = getChoiceWindowMs(next.choices);
      setChoiceWindowMs(nextWindow);
      setTimeLeftMs(nextWindow);

      sound?.updateMusic(next.tired, nextWindow, nextWindow);

      flowRef.current = false;
    },
    [choiceWindowMs, timeLeftMs, triggerVisualFx]
  );

  useEffect(() => {
    if (
      state.phase !== "choosing" ||
      state.gameOver ||
      timeLeftMs > 0 ||
      flowRef.current
    )
      return;

    const fallbackChoice =
      state.choices[Math.floor(Math.random() * state.choices.length)] ||
      state.choices[0];

    if (fallbackChoice) void playChoiceFlow(fallbackChoice, true);
  }, [timeLeftMs, state, playChoiceFlow]);

  const handleReplay = () => {
    flowRef.current = false;
    gameOverSavedRef.current = false;
    setShowOutcome(false);
    setHoveredChoiceId(null);
    setVisualFx(null);
    soundRef.current?.start();

    const fresh = beginChoosing(restartRun(Math.max(bestRun, profile.bestRun)));

    stateRef.current = fresh;
    setState(fresh);

    const nextWindow = getChoiceWindowMs(fresh.choices);
    setChoiceWindowMs(nextWindow);
    setTimeLeftMs(nextWindow);
    previousTiredRef.current = fresh.tired;

    soundRef.current?.updateMusic(fresh.tired, nextWindow, nextWindow);
  };

  return (
    <main
      className={`relative min-h-[100svh] overflow-hidden px-3 pb-[232px] pt-2 text-[#1E1B18] sm:h-screen sm:px-4 sm:pb-2 sm:pt-8 ${screenFxClass}`}
    >
      <style jsx>{`
        @keyframes towTinyPop {
          0% {
            transform: translate(-50%, -50%) scale(0.82);
            opacity: 0;
          }
          18% {
            transform: translate(-50%, -50%) scale(1.04);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -120%) scale(0.96);
            opacity: 0;
          }
        }

        @keyframes towScreenShake {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          20% {
            transform: translate3d(-3px, 2px, 0);
          }
          40% {
            transform: translate3d(3px, -1px, 0);
          }
          60% {
            transform: translate3d(-2px, -2px, 0);
          }
          80% {
            transform: translate3d(2px, 1px, 0);
          }
        }

        @keyframes towSoftWin {
          0% {
            filter: saturate(1);
          }
          45% {
            filter: saturate(1.18) brightness(1.03);
          }
          100% {
            filter: saturate(1);
          }
        }

        @keyframes towGlitch {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            filter: none;
          }
          20% {
            transform: translate3d(2px, 0, 0);
            filter: hue-rotate(8deg) contrast(1.05);
          }
          40% {
            transform: translate3d(-2px, 1px, 0);
            filter: hue-rotate(-8deg) contrast(1.08);
          }
          65% {
            transform: translate3d(1px, -1px, 0);
            filter: contrast(1.06);
          }
        }

        .tow-screen-rekt {
          animation: towScreenShake 180ms ease-in-out both;
        }

        .tow-screen-glitch {
          animation: towGlitch 260ms steps(2, end) both;
        }

        .tow-screen-win {
          animation: towSoftWin 420ms ease both;
        }

        .tow-screen-lose,
        .tow-screen-close {
          animation: towScreenShake 120ms ease-in-out both;
        }

        .tow-fx-word {
          animation: towTinyPop 720ms ease-out both;
        }
      `}</style>

      <SceneLayer
        state={state}
        timeLeftMs={timeLeftMs}
        choiceWindowMs={choiceWindowMs}
      />

      {visualFx && (
        <>
          <div
            key={`edge-${visualFx.id}`}
            className={`pointer-events-none fixed inset-0 z-40 ${
              visualFx.kind === "win"
                ? "bg-emerald-300/10"
                : visualFx.kind === "closeCall"
                ? "bg-yellow-300/12"
                : visualFx.kind === "glitch"
                ? "bg-cyan-300/10"
                : visualFx.kind === "tap"
                ? "bg-white/8"
                : "bg-red-400/10"
            }`}
          />

          <div
            key={`word-${visualFx.id}`}
            className={`tow-fx-word pointer-events-none fixed left-1/2 top-[47%] z-[70] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-5 py-2 text-center text-[16px] font-black uppercase tracking-[0.18em] shadow-xl backdrop-blur-md sm:text-[22px] ${
              visualFx.kind === "win"
                ? "border-emerald-500 bg-emerald-100/90 text-emerald-700"
                : visualFx.kind === "closeCall"
                ? "border-yellow-500 bg-yellow-100/95 text-yellow-700"
                : visualFx.kind === "glitch"
                ? "border-cyan-500 bg-cyan-100/90 text-cyan-700"
                : visualFx.kind === "tap"
                ? "border-black/40 bg-white/80 text-black/70"
                : "border-red-500 bg-red-100/95 text-red-700"
            }`}
          >
            {visualFx.label}
          </div>
        </>
      )}

      <header className="absolute left-0 top-0 z-30 flex w-full items-center px-3 py-3 text-sm sm:px-4">
        <Link
          href="/"
          className="rounded-full bg-[#FFFCF8]/90 px-4 py-2 font-black tracking-tight text-[#1E1B18] shadow-sm backdrop-blur transition hover:bg-[#1E1B18] hover:text-white"
        >
          TOW
        </Link>

        <div className="ml-auto rounded-full bg-[#FFFCF8]/90 px-4 py-2 font-black text-[#1E1B18] shadow-sm backdrop-blur">
          {isRewardRun ? `Reward Run • @${rewardUsername}` : "Fun Run"}
        </div>
      </header>

      <section className="mx-auto flex min-h-[100svh] w-full max-w-[1040px] flex-col items-center pt-[58px] sm:h-full sm:min-h-0 sm:pt-0">
        <div className="w-full rounded-[22px] border border-[#DDD7CE]/70 bg-[#FFFCF8]/72 p-2 shadow-[0_16px_52px_rgba(30,27,24,0.07)] backdrop-blur-xl sm:rounded-[24px] sm:p-2.5 md:max-w-[620px]">
          <TiredMeter tired={state.tired} max={MAX_TIRED} turns={state.turn} />
        </div>

        <div className="relative -mt-1 h-[372px] w-full shrink-0 overflow-visible min-[390px]:h-[388px] sm:mt-2 sm:h-[375px]">
          <div className="pointer-events-none absolute left-1 top-[76px] z-20 max-w-[42vw] truncate rounded-full bg-white/68 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#8A8278] shadow-sm backdrop-blur-md sm:left-2 sm:top-[96px] sm:max-w-none sm:px-3 sm:text-[14px] sm:tracking-[0.2em] md:left-[110px]">
            {runArc.title}
          </div>

          <div className="pointer-events-none absolute right-1 top-[82px] z-20 max-w-[42vw] truncate rounded-full bg-white/68 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] shadow-sm backdrop-blur-md sm:right-2 sm:top-[104px] sm:max-w-none sm:px-3 sm:text-[14px] sm:tracking-[0.2em] md:right-[110px]">
            <span className={market.color}>{market.label}</span>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[10px] z-30 max-w-[76vw] -translate-x-1/2 rounded-full bg-white/70 px-3.5 py-1 text-center text-[12px] font-black lowercase leading-snug text-[#6F685F] shadow-sm backdrop-blur-md sm:top-[34px] sm:max-w-[500px] sm:px-4">
            {runBeat}
          </div>

          <div className="absolute left-1/2 top-[38px] z-10 -translate-x-1/2 scale-[0.96] min-[390px]:scale-100 sm:top-[58px] sm:scale-100">
            <div className="absolute bottom-5 left-1/2 h-12 w-36 -translate-x-1/2 rounded-full bg-black/10 blur-2xl" />
            <TowCharacter
              state={characterState}
              timeLeftMs={timeLeftMs}
              choiceWindowMs={choiceWindowMs}
              width={242}
              height={242}
            />
          </div>

          <div className="pointer-events-none absolute bottom-[2px] left-1/2 z-20 w-full -translate-x-1/2 sm:bottom-[14px]">
            <OutcomePanel
              outcome={state.lastOutcome}
              visible={showOutcome}
              gameOver={state.gameOver}
            />
          </div>
        </div>

        <div className="fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-0 right-0 z-50 mx-auto w-full px-3 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto sm:mt-0 sm:px-0 sm:pb-8">
          {state.phase === "choosing" &&
            !state.gameOver &&
            timeLeftMs <= 5000 && (
              <div className="pointer-events-none absolute left-1/2 top-[-44px] z-40 -translate-x-1/2 sm:top-[-62px]">
                <div className="animate-pulse rounded-full border border-red-300 bg-red-100/95 px-5 py-1.5 text-[13px] font-black uppercase tracking-[0.12em] text-red-600 shadow-[0_0_22px_rgba(239,68,68,0.35)] backdrop-blur-md">
                  pick now · {Math.ceil(timeLeftMs / 1000)}
                </div>
              </div>
            )}

          <ActionButtons
            choices={state.choices}
            selectedChoiceId={state.selectedChoiceId}
            hoveredChoiceId={hoveredChoiceId}
            onHoverChange={setHoveredChoiceId}
            onSelect={(choice) => void playChoiceFlow(choice)}
            disabled={state.phase !== "choosing" || state.gameOver}
          />
        </div>
      </section>

      <GameOverOverlay
        state={state}
        bestRun={Math.max(bestRun, profile.bestRun)}
        profile={profile}
        onReplay={handleReplay}
      />
    </main>
  );
}