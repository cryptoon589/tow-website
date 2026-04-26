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

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getChoiceWindowMs(choices: Choice[]) {
  const longest = choices.reduce((max, choice) => {
    return Math.max(max, choice.label.length + choice.whisper.length);
  }, 0);

  return Math.min(
    MAX_CHOICE_WINDOW_MS,
    MIN_CHOICE_WINDOW_MS + Math.max(0, longest - 26) * 80,
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
  persona: PlayerProfile["persona"],
) {
  const arc = getRunArc(state);
  const kind = state.lastOutcome?.kind;

  if (state.gameOver) return `${arc.title}: timeline cooked`;
  if (state.phase === "committed") return "checking phone...";
  if (state.phase === "resolving" && kind === "glitch")
    return "timeline forked";
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

function createSoundEngine() {
  let ctx: AudioContext | null = null;
  let lastTick = 0;
  let ambient: { osc: OscillatorNode; amp: GainNode } | null = null;

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
    gain = 0.025,
    type: OscillatorType = "sine",
    delayTime = 0,
  ) => {
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

    const buffer = audio.createBuffer(
      1,
      Math.max(1, Math.floor(audio.sampleRate * duration)),
      audio.sampleRate,
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const source = audio.createBufferSource();
    const amp = audio.createGain();

    source.buffer = buffer;
    amp.gain.value = gain;

    source.connect(amp);
    amp.connect(audio.destination);
    source.start();
  };

  return {
    setPressure(tired: number, urgency: number) {
      const audio = getCtx();
      if (!audio) return;

      const pressure = Math.max(tired / 100, urgency);

      if (pressure < 0.62) {
        if (ambient)
          ambient.amp.gain.setTargetAtTime(0.0001, audio.currentTime, 0.08);
        return;
      }

      if (!ambient) {
        const osc = audio.createOscillator();
        const amp = audio.createGain();

        osc.type = "triangle";
        osc.frequency.value = 44;
        amp.gain.value = 0.0001;

        osc.connect(amp);
        amp.connect(audio.destination);
        osc.start();

        ambient = { osc, amp };
      }

      ambient.osc.frequency.setTargetAtTime(
        42 + pressure * 18,
        audio.currentTime,
        0.12,
      );
      ambient.amp.gain.setTargetAtTime(
        0.002 + pressure * 0.006,
        audio.currentTime,
        0.1,
      );
    },

    tap() {
      tone(220, 0.045, 0.018, "square");
      tone(440, 0.04, 0.01, "sine", 0.035);
    },

    tick(msLeft: number) {
      const now = Date.now();
      if (now - lastTick < 450) return;

      lastTick = now;
      tone(
        msLeft < 1000 ? 740 : 520,
        0.035,
        msLeft < 1000 ? 0.024 : 0.014,
        "square",
      );
    },

    tension() {
      tone(164, 0.11, 0.012, "triangle");
    },

    win(big = false) {
      tone(392, 0.07, 0.022, "sine");
      tone(big ? 659 : 523, 0.09, 0.024, "sine", 0.055);
      tone(big ? 784 : 659, 0.11, 0.02, "sine", 0.12);
    },

    closeCall() {
      tone(92, 0.08, 0.02, "sawtooth");
      tone(523, 0.12, 0.018, "sine", 0.09);
      tone(784, 0.14, 0.016, "sine", 0.18);
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

function playOutcomeSound(
  sound: ReturnType<typeof createSoundEngine>,
  kind: OutcomeKind,
  headline = "",
) {
  const closeCall = [
    "BARELY ALIVE",
    "ONE HP",
    "ALMOST REKT",
    "CLUTCH SAVE",
    "ONE TAP LEFT",
    "NOT DEAD YET",
    "HANGING ON",
  ].includes(headline);

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
    createFreshProfile(),
  );
  const [bestRun, setBestRun] = useState(0);
  const [state, setState] = useState<GameState>(() =>
    beginChoosing(createInitialState(0)),
  );
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [choiceWindowMs, setChoiceWindowMs] = useState(() =>
    getChoiceWindowMs(state.choices),
  );
  const [timeLeftMs, setTimeLeftMs] = useState(choiceWindowMs);
  const [showOutcome, setShowOutcome] = useState(false);
  const [rewardProfile, setRewardProfile] =
    useState<ReturnType<typeof getRewardProfile>>(null);
  const [mode, setMode] = useState<"fun" | "earn">("fun");

  const isRewardRun = mode === "earn" && rewardProfile !== null;

  const flowRef = useRef(false);
  const gameOverSavedRef = useRef(false);
  const stateRef = useRef(state);
  const profileRef = useRef(profile);
  const soundRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);

  if (!soundRef.current && typeof window !== "undefined") {
    soundRef.current = createSoundEngine();
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMode(params.get("mode") === "earn" ? "earn" : "fun");
    setRewardProfile(getRewardProfile());
  }, []);

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    profileRef.current = stored;
    setBestRun(stored.bestRun);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const market = useMemo(() => getMarketState(state), [state]);
  const characterState = useMemo(() => getCharacterState(state), [state]);
  const runArc = useMemo(() => getRunArc(state), [state]);

  const runBeat = useMemo(
    () => getRunBeat(state, timeLeftMs, choiceWindowMs, profile.persona),
    [state, timeLeftMs, choiceWindowMs, profile.persona],
  );

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

      const urgency = 1 - next / nextWindow;
      soundRef.current?.setPressure(stateRef.current.tired, urgency);

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
      submitLeaderboardScore(state.turn);
      window.dispatchEvent(new Event("tow-leaderboard-update"));
    }
  }, [state, isRewardRun]);

  const playChoiceFlow = useCallback(
    async (choice: Choice, wasAutoPicked = false) => {
      const current = stateRef.current;
      const sound = soundRef.current;

      if (flowRef.current || current.gameOver || current.phase !== "choosing")
        return;

      flowRef.current = true;
      setHoveredChoiceId(null);
      setShowOutcome(false);
      sound?.tap();

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
        profileRef.current.persona,
      );

      stateRef.current = resolved.state;
      setState(resolved.state);

      setShowOutcome(false);
      await delay(90);
      setShowOutcome(true);

      playOutcomeSound(
        sound ?? createSoundEngine(),
        resolved.outcome.kind,
        resolved.outcome.headline,
      );

      const kind = resolved.outcome.kind as OutcomeKind;
      const almost = [
        "BARELY ALIVE",
        "ONE HP",
        "ALMOST REKT",
        "CLUTCH SAVE",
        "ONE TAP LEFT",
        "NOT DEAD YET",
        "HANGING ON",
      ].includes(resolved.outcome.headline);

      const hold =
        kind === "rekt" || kind === "glitch" || almost
          ? 2100
          : 1650 + Math.random() * 520;
      await delay(hold);

      if (resolved.state.gameOver) {
        sound?.gameOver();
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

      flowRef.current = false;
    },
    [choiceWindowMs, timeLeftMs],
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

    const fresh = beginChoosing(restartRun(Math.max(bestRun, profile.bestRun)));

    stateRef.current = fresh;
    setState(fresh);

    const nextWindow = getChoiceWindowMs(fresh.choices);
    setChoiceWindowMs(nextWindow);
    setTimeLeftMs(nextWindow);
  };

  return (
    <main className="relative h-screen overflow-hidden px-4 pb-2 pt-8 text-[#1E1B18]">
      <SceneLayer
        state={state}
        timeLeftMs={timeLeftMs}
        choiceWindowMs={choiceWindowMs}
      />

      <header className="absolute left-0 top-0 z-20 flex w-full items-center px-4 py-3 text-sm">
        <Link href="/" className="font-black tracking-tight text-[#1E1B18]">
          TOW
        </Link>
      </header>

      <div className="absolute right-4 top-3 z-20 rounded-full bg-[#FFFCF8]/80 px-3 py-1 text-xs font-black text-[#1E1B18] shadow-sm backdrop-blur">
        {rewardProfile && isRewardRun
          ? `Reward Run · @${rewardProfile.xUsername}`
          : "Fun Run"}
      </div>

      <section className="mx-auto flex h-full w-full max-w-[1040px] flex-col items-center">
        <div className="w-full rounded-[24px] border border-[#DDD7CE]/70 bg-[#FFFCF8]/72 p-2.5 shadow-[0_16px_52px_rgba(30,27,24,0.07)] backdrop-blur-xl md:max-w-[620px]">
          <TiredMeter tired={state.tired} max={MAX_TIRED} />
        </div>

        <div className="relative mt-2 h-[375px] w-full shrink-0 overflow-visible">
          <div className="pointer-events-none absolute left-2 top-[96px] z-20 rounded-full bg-white/55 px-3 py-1 text-[14px] font-black uppercase tracking-[0.2em] text-[#8A8278] shadow-sm backdrop-blur-md md:left-[110px]">
            {runArc.title}
          </div>

          <div className="pointer-events-none absolute right-2 top-[104px] z-20 rounded-full bg-white/55 px-3 py-1 text-[14px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md md:right-[110px]">
            <span className={market.color}>{market.label}</span>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[34px] z-30 max-w-[500px] -translate-x-1/2 rounded-full bg-white/62 px-4 py-1 text-center text-[12px] font-black lowercase text-[#6F685F] shadow-sm backdrop-blur-md">
            {runBeat}
          </div>

          <div className="absolute left-1/2 top-[58px] z-10 -translate-x-1/2">
            <div className="absolute bottom-5 left-1/2 h-12 w-36 -translate-x-1/2 rounded-full bg-black/10 blur-2xl" />
            <TowCharacter
              state={characterState}
              timeLeftMs={timeLeftMs}
              choiceWindowMs={choiceWindowMs}
              width={242}
              height={242}
            />
          </div>

          <div className="pointer-events-none absolute bottom-[14px] left-1/2 z-20 w-full -translate-x-1/2">
            <OutcomePanel
              outcome={state.lastOutcome}
              visible={showOutcome}
              gameOver={state.gameOver}
            />
          </div>
        </div>

        <div className="relative mt-0 w-full pb-8">
          {state.phase === "choosing" &&
            !state.gameOver &&
            timeLeftMs <= 5000 && (
              <div className="pointer-events-none absolute left-1/2 top-[-62px] z-40 -translate-x-1/2">
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
