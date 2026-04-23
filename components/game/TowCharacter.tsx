"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type OutcomeKind =
  | "winSmall"
  | "win"
  | "loseSmall"
  | "lose"
  | "rekt"
  | "glitch"
  | null;

type TowGameStateLike = {
  lastOutcome?: {
    mood?: string;
    vfx?: string;
    kind?: OutcomeKind;
  } | null;
  phase?: string;
  isResolving?: boolean;
  isChoosing?: boolean;
  isIdle?: boolean;
};

type HeadPose = "idle" | "lean";
type ArmPose = "neutral" | "choose" | "tap" | "phone-check";
type BaseKey = `${HeadPose}-${ArmPose}`;

type FaceExpression =
  | "neutral"
  | "blink"
  | "tired"
  | "numb"
  | "frown"
  | "look-away"
  | "sigh"
  | "confused"
  | "shock"
  | "tap"
  | "win-small"
  | "win-big"
  | "lose-small"
  | "lose-big"
  | "rekt";

type FaceKey = `${HeadPose}-${FaceExpression}`;

type VfxKey =
  | "none"
  | "vfx-sweat"
  | "vfx-question"
  | "vfx-phone-check-red"
  | "vfx-phone-check-green"
  | "vfx-phone-check-impact"
  | "vfx-alert"
  | "vfx-glitch";

type MetaState =
  | "idleLoop"
  | "awaitingChoice"
  | "committed"
  | "suspense"
  | "input"
  | "resolveWin"
  | "resolveLose"
  | "resolveRekt"
  | "timeout"
  | "recover";

type TowCharacterProps = {
  state: TowGameStateLike;
  preAction?: boolean;
  hesitationMs?: number;
  timeLeftMs?: number;
  choiceWindowMs?: number;
  tapped?: boolean;
  selected?: boolean;
  autoPicked?: boolean;
  className?: string;
  width?: number | string;
  height?: number | string;
  onSequenceDone?: () => void;
};

type RenderState = {
  headPose: HeadPose;
  armPose: ArmPose;
  face: FaceExpression;
  vfx: VfxKey;
  meta: MetaState;
};

type RenderStep = Omit<RenderState, "meta"> & {
  durationMs: number;
};

const BASE_SPRITES: Record<BaseKey, string> = {
  "idle-neutral": "/tow/base/base-idle-neutral.png",
  "idle-choose": "/tow/base/base-idle-neutral.png",
  "idle-tap": "/tow/base/base-idle-phone-check.png",
  "idle-phone-check": "/tow/base/base-idle-phone-check.png",
  "lean-neutral": "/tow/base/base-lean-phone-choose.png",
  "lean-choose": "/tow/base/base-lean-phone-choose.png",
  "lean-tap": "/tow/base/base-lean-phone-tap.png",
  "lean-phone-check": "/tow/base/base-lean-phone-check.png",
};

const FACE_SPRITES: Record<FaceKey, string> = {
  "idle-neutral": "/tow/face/face-idle-neutral.png",
  "idle-blink": "/tow/face/face-idle-blink.png",
  "idle-tired": "/tow/face/face-idle-tired.png",
  "idle-numb": "/tow/face/face-idle-numb.png",
  "idle-frown": "/tow/face/face-idle-frown.png",
  "idle-look-away": "/tow/face/face-idle-look-away.png",
  "idle-sigh": "/tow/face/face-idle-sigh.png",
  "idle-confused": "/tow/face/face-idle-confused.png",
  "idle-shock": "/tow/face/face-idle-shock.png",
  "idle-tap": "/tow/face/face-idle-tap.png",
  "idle-win-small": "/tow/face/face-idle-win-small.png",
  "idle-win-big": "/tow/face/face-idle-win-big.png",
  "idle-lose-small": "/tow/face/face-idle-lose-small.png",
  "idle-lose-big": "/tow/face/face-idle-lose-big.png",
  "idle-rekt": "/tow/face/face-idle-rekt.png",

  "lean-neutral": "/tow/face/face-lean-neutral.png",
  "lean-blink": "/tow/face/face-lean-blink.png",
  "lean-tired": "/tow/face/face-lean-tired.png",
  "lean-numb": "/tow/face/face-lean-numb.png",
  "lean-frown": "/tow/face/face-lean-frown.png",
  "lean-look-away": "/tow/face/face-lean-look-away.png",
  "lean-sigh": "/tow/face/face-lean-sigh.png",
  "lean-confused": "/tow/face/face-lean-confused.png",
  "lean-shock": "/tow/face/face-lean-shock.png",
  "lean-tap": "/tow/face/face-lean-tap.png",
  "lean-win-small": "/tow/face/face-lean-win-small.png",
  "lean-win-big": "/tow/face/face-lean-win-big.png",
  "lean-lose-small": "/tow/face/face-lean-lose-small.png",
  "lean-lose-big": "/tow/face/face-lean-lose-big.png",
  "lean-rekt": "/tow/face/face-idle-rekt.png",
};

const VFX_SPRITES: Record<Exclude<VfxKey, "none">, string> = {
  "vfx-sweat": "/tow/vfx/vfx-sweat.png",
  "vfx-question": "/tow/vfx/vfx-question.png",
  "vfx-phone-check-red": "/tow/vfx/vfx-phone-check-red.png",
  "vfx-phone-check-green": "/tow/vfx/vfx-phone-check-green.png",
  "vfx-phone-check-impact": "/tow/vfx/vfx-phone-check-impact.png",
  "vfx-alert": "/tow/vfx/vfx-alert.png",
  "vfx-glitch": "/tow/vfx/vfx-glitch.png",
};

const ALLOWED_VFX_BY_BASE: Record<BaseKey, readonly VfxKey[]> = {
  "idle-neutral": ["none", "vfx-question", "vfx-alert", "vfx-glitch", "vfx-sweat"],
  "idle-choose": ["none", "vfx-question", "vfx-alert", "vfx-glitch", "vfx-sweat"],
  "idle-tap": ["none", "vfx-alert", "vfx-glitch"],
  "idle-phone-check": [
    "none",
    "vfx-question",
    "vfx-alert",
    "vfx-glitch",
    "vfx-sweat",
    "vfx-phone-check-red",
    "vfx-phone-check-green",
    "vfx-phone-check-impact",
  ],
  "lean-neutral": ["none", "vfx-question", "vfx-alert", "vfx-glitch", "vfx-sweat"],
  "lean-choose": ["none", "vfx-question", "vfx-alert", "vfx-glitch", "vfx-sweat"],
  "lean-tap": ["none", "vfx-alert", "vfx-glitch"],
  "lean-phone-check": [
    "none",
    "vfx-question",
    "vfx-alert",
    "vfx-glitch",
    "vfx-sweat",
    "vfx-phone-check-red",
    "vfx-phone-check-green",
    "vfx-phone-check-impact",
  ],
};

const DEFAULT_RENDER_STATE: RenderState = {
  headPose: "idle",
  armPose: "neutral",
  face: "tired",
  vfx: "none",
  meta: "idleLoop",
};

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pickWeighted<T>(items: Array<{ value: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

function normalizeOutcome(state: TowGameStateLike): OutcomeKind {
  const explicit = state.lastOutcome?.kind;
  if (explicit) return explicit;

  const mood = state.lastOutcome?.mood?.toLowerCase() ?? "";
  const vfx = state.lastOutcome?.vfx?.toLowerCase() ?? "";

  if (vfx.includes("glitch")) return "glitch";
  if (mood.includes("rekt")) return "rekt";

  if (
    mood.includes("win") ||
    mood.includes("good") ||
    mood.includes("happy") ||
    mood.includes("green")
  ) {
    return "winSmall";
  }

  if (
    mood.includes("lose") ||
    mood.includes("bad") ||
    mood.includes("regret") ||
    mood.includes("red")
  ) {
    return "loseSmall";
  }

  if (vfx.includes("green")) return "winSmall";
  if (vfx.includes("red")) return "loseSmall";

  return null;
}

function clampVfx(headPose: HeadPose, armPose: ArmPose, desired: VfxKey): VfxKey {
  const key: BaseKey = `${headPose}-${armPose}`;
  const allowed = ALLOWED_VFX_BY_BASE[key] ?? ["none"];
  return allowed.includes(desired) ? desired : "none";
}

function buildIdleFrame(): RenderStep {
  const picked = pickWeighted<
    Pick<RenderStep, "headPose" | "armPose" | "face" | "vfx" | "durationMs">
  >([
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "tired",
        vfx: "none",
        durationMs: randInt(1500, 2400),
      },
      weight: 28,
    },
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "neutral",
        vfx: "none",
        durationMs: randInt(1300, 2200),
      },
      weight: 20,
    },
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "blink",
        vfx: "none",
        durationMs: randInt(70, 120),
      },
      weight: 11,
    },
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "numb",
        vfx: "none",
        durationMs: randInt(1200, 1900),
      },
      weight: 12,
    },
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "look-away",
        vfx: "none",
        durationMs: randInt(320, 580),
      },
      weight: 8,
    },
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "sigh",
        vfx: "none",
        durationMs: randInt(360, 620),
      },
      weight: 7,
    },
    {
      value: {
        headPose: "idle",
        armPose: "phone-check",
        face: "neutral",
        vfx: "none",
        durationMs: randInt(420, 760),
      },
      weight: 10,
    },
    {
      value: {
        headPose: "idle",
        armPose: "neutral",
        face: "blink",
        vfx: "none",
        durationMs: randInt(60, 90),
      },
      weight: 4,
    },
  ]);

  return {
    ...picked,
    vfx: clampVfx(picked.headPose, picked.armPose, picked.vfx),
  };
}

function buildAwaitingChoiceFrame(
  timeLeftMs: number,
  choiceWindowMs: number,
  hesitationMs: number
): RenderStep {
  const ratio =
    choiceWindowMs > 0
      ? Math.max(0, Math.min(1, timeLeftMs / choiceWindowMs))
      : 1;

  const microVariant = Math.random();

  if (ratio <= 0.12 || hesitationMs >= 6500) {
    return {
      headPose: "lean",
      armPose: "phone-check",
      face:
        microVariant < 0.18
          ? "shock"
          : microVariant < 0.62
          ? "tired"
          : "confused",
      vfx: clampVfx("lean", "phone-check", "vfx-sweat"),
      durationMs: 120,
    };
  }

  if (ratio <= 0.35 || hesitationMs >= 4000) {
    return {
      headPose: "lean",
      armPose: "phone-check",
      face:
        microVariant < 0.2
          ? "blink"
          : microVariant < 0.78
          ? "confused"
          : "neutral",
      vfx: clampVfx(
        "lean",
        "phone-check",
        microVariant < 0.18 ? "vfx-sweat" : "vfx-question"
      ),
      durationMs: 145,
    };
  }

  if (ratio <= 0.65 || hesitationMs >= 2200) {
    return {
      headPose: "lean",
      armPose: "phone-check",
      face:
        microVariant < 0.18
          ? "look-away"
          : microVariant < 0.3
          ? "blink"
          : "neutral",
      vfx: "none",
      durationMs: 165,
    };
  }

  return {
    headPose: "lean",
    armPose: "choose",
    face: microVariant < 0.12 ? "blink" : "neutral",
    vfx: "none",
    durationMs: 145,
  };
}

function buildTapSequence(): RenderStep[] {
  return [
    {
      headPose: "lean",
      armPose: "choose",
      face: "tap",
      vfx: "none",
      durationMs: randInt(70, 95),
    },
    {
      headPose: "lean",
      armPose: "tap",
      face: "tap",
      vfx: clampVfx("lean", "tap", "vfx-alert"),
      durationMs: randInt(85, 115),
    },
    {
      headPose: "lean",
      armPose: "tap",
      face: "neutral",
      vfx: "none",
      durationMs: randInt(35, 55),
    },
  ];
}

function buildTimeoutSequence(): RenderStep[] {
  return [
    {
      headPose: "lean",
      armPose: "phone-check",
      face: pickWeighted<FaceExpression>([
        { value: "confused", weight: 50 },
        { value: "shock", weight: 30 },
        { value: "numb", weight: 20 },
      ]),
      vfx: clampVfx("lean", "phone-check", "vfx-question"),
      durationMs: 110,
    },
    {
      headPose: "lean",
      armPose: "tap",
      face: "shock",
      vfx: clampVfx("lean", "tap", "vfx-alert"),
      durationMs: 110,
    },
    {
      headPose: "lean",
      armPose: "phone-check",
      face: "numb",
      vfx: clampVfx("lean", "phone-check", "vfx-phone-check-impact"),
      durationMs: 150,
    },
  ];
}

function buildSuspenseFrame(): RenderStep {
  return {
    headPose: "lean",
    armPose: "phone-check",
    face: pickWeighted<FaceExpression>([
      { value: "neutral", weight: 45 },
      { value: "confused", weight: 35 },
      { value: "shock", weight: 20 },
    ]),
    vfx: "none",
    durationMs: randInt(140, 200),
  };
}

function buildWinSequence(kind: "winSmall" | "win"): RenderStep[] {
  if (kind === "win") {
    return [
      {
        headPose: "lean",
        armPose: "phone-check",
        face: "win-big",
        vfx: clampVfx("lean", "phone-check", "vfx-phone-check-green"),
        durationMs: randInt(190, 290),
      },
      {
        headPose: "idle",
        armPose: "phone-check",
        face: pickWeighted<FaceExpression>([
          { value: "win-big", weight: 58 },
          { value: "numb", weight: 24 },
          { value: "neutral", weight: 18 },
        ]),
        vfx: "none",
        durationMs: randInt(240, 420),
      },
    ];
  }

  return [
    {
      headPose: "lean",
      armPose: "phone-check",
      face: "win-small",
      vfx: clampVfx("lean", "phone-check", "vfx-phone-check-green"),
      durationMs: randInt(160, 250),
    },
    {
      headPose: "idle",
      armPose: "phone-check",
      face: pickWeighted<FaceExpression>([
        { value: "win-small", weight: 60 },
        { value: "numb", weight: 25 },
        { value: "neutral", weight: 15 },
      ]),
      vfx: "none",
      durationMs: randInt(200, 360),
    },
  ];
}

function buildLoseSequence(kind: "loseSmall" | "lose"): RenderStep[] {
  if (kind === "lose") {
    return [
      {
        headPose: "lean",
        armPose: "phone-check",
        face: "shock",
        vfx: clampVfx("lean", "phone-check", "vfx-phone-check-red"),
        durationMs: randInt(80, 120),
      },
      {
        headPose: "lean",
        armPose: "phone-check",
        face: "lose-big",
        vfx: clampVfx("lean", "phone-check", "vfx-phone-check-red"),
        durationMs: randInt(200, 300),
      },
      {
        headPose: "idle",
        armPose: "phone-check",
        face: pickWeighted<FaceExpression>([
          { value: "lose-big", weight: 52 },
          { value: "tired", weight: 28 },
          { value: "frown", weight: 20 },
        ]),
        vfx: "none",
        durationMs: randInt(280, 500),
      },
    ];
  }

  return [
    {
      headPose: "lean",
      armPose: "phone-check",
      face: pickWeighted<FaceExpression>([
        { value: "shock", weight: 26 },
        { value: "lose-small", weight: 74 },
      ]),
      vfx: clampVfx("lean", "phone-check", "vfx-phone-check-red"),
      durationMs: randInt(90, 150),
    },
    {
      headPose: "idle",
      armPose: "phone-check",
      face: pickWeighted<FaceExpression>([
        { value: "lose-small", weight: 55 },
        { value: "frown", weight: 30 },
        { value: "numb", weight: 15 },
      ]),
      vfx: "none",
      durationMs: randInt(220, 380),
    },
  ];
}

function buildRektSequence(): RenderStep[] {
  return [
    {
      headPose: "lean",
      armPose: "phone-check",
      face: "shock",
      vfx: clampVfx("lean", "phone-check", "vfx-phone-check-red"),
      durationMs: 95,
    },
    {
      headPose: "lean",
      armPose: "phone-check",
      face: "rekt",
      vfx: clampVfx("lean", "phone-check", "vfx-glitch"),
      durationMs: 170,
    },
    {
      headPose: "idle",
      armPose: "phone-check",
      face: "rekt",
      vfx: "none",
      durationMs: 560,
    },
  ];
}

function buildGlitchSequence(): RenderStep[] {
  return [
    {
      headPose: "lean",
      armPose: "tap",
      face: "shock",
      vfx: clampVfx("lean", "tap", "vfx-glitch"),
      durationMs: 80,
    },
    {
      headPose: "lean",
      armPose: "phone-check",
      face: "confused",
      vfx: clampVfx("lean", "phone-check", "vfx-glitch"),
      durationMs: 100,
    },
    {
      headPose: "idle",
      armPose: "phone-check",
      face: "numb",
      vfx: "none",
      durationMs: 240,
    },
  ];
}

function buildRecoverFrame(): RenderStep {
  const face = pickWeighted<FaceExpression>([
    { value: "tired", weight: 46 },
    { value: "neutral", weight: 20 },
    { value: "numb", weight: 20 },
    { value: "frown", weight: 14 },
  ]);

  return {
    headPose: "idle",
    armPose: "neutral",
    face,
    vfx: "none",
    durationMs: randInt(200, 360),
  };
}

export default function TowCharacter({
  state,
  preAction = false,
  hesitationMs = 0,
  timeLeftMs = 5500,
  choiceWindowMs = 5500,
  tapped = false,
  selected = false,
  autoPicked = false,
  className = "",
  width = 420,
  height = 420,
  onSequenceDone,
}: TowCharacterProps) {
  const [renderState, setRenderState] = useState<RenderState>(DEFAULT_RENDER_STATE);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTappedRef = useRef(false);
  const prevAutoPickedRef = useRef(false);
  const prevOutcomeObjectRef = useRef<TowGameStateLike["lastOutcome"] | null>(null);
  const sequenceIdRef = useRef(0);

  const outcome = useMemo(() => normalizeOutcome(state), [state]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const applyStep = (step: RenderStep, meta: MetaState) => {
    setRenderState({
      headPose: step.headPose,
      armPose: step.armPose,
      face: step.face,
      vfx: clampVfx(step.headPose, step.armPose, step.vfx),
      meta,
    });
  };

  const runSequence = (
    steps: RenderStep[],
    meta: MetaState,
    done?: () => void
  ) => {
    clearTimer();
    sequenceIdRef.current += 1;
    const seqId = sequenceIdRef.current;
    let index = 0;

    const next = () => {
      if (seqId !== sequenceIdRef.current) return;

      const step = steps[index];
      if (!step) {
        done?.();
        return;
      }

      applyStep(step, meta);
      index += 1;
      timerRef.current = setTimeout(next, step.durationMs);
    };

    next();
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  useEffect(() => {
    if (!state.lastOutcome) return;
    if (state.lastOutcome === prevOutcomeObjectRef.current) return;

    prevOutcomeObjectRef.current = state.lastOutcome;

    if (!outcome) return;

    let steps: RenderStep[] = [];
    let meta: MetaState = "resolveLose";

    if (outcome === "win" || outcome === "winSmall") {
      steps = buildWinSequence(outcome);
      meta = "resolveWin";
    } else if (outcome === "rekt") {
      steps = buildRektSequence();
      meta = "resolveRekt";
    } else if (outcome === "glitch") {
      steps = buildGlitchSequence();
      meta = "resolveRekt";
    } else {
      steps = buildLoseSequence(outcome);
      meta = "resolveLose";
    }

    runSequence(steps, meta, () => {
      runSequence([buildRecoverFrame()], "recover", () => {
        setRenderState((prev) => ({ ...prev, meta: "idleLoop" }));
        onSequenceDone?.();
      });
    });
  }, [state.lastOutcome, outcome, onSequenceDone]);

  useEffect(() => {
    if (autoPicked && prevAutoPickedRef.current !== autoPicked) {
      prevAutoPickedRef.current = autoPicked;

      runSequence(buildTimeoutSequence(), "timeout", () => {
        runSequence([buildSuspenseFrame()], "suspense");
      });

      return;
    }

    prevAutoPickedRef.current = autoPicked;
  }, [autoPicked]);

  useEffect(() => {
    if (!tapped || prevTappedRef.current === tapped) {
      prevTappedRef.current = tapped;
      return;
    }

    prevTappedRef.current = tapped;

    runSequence(buildTapSequence(), "input", () => {
      runSequence([buildSuspenseFrame()], "suspense", () => {
        if (!normalizeOutcome(state)) {
          runSequence([buildRecoverFrame()], "recover", () => {
            setRenderState((prev) => ({ ...prev, meta: "idleLoop" }));
          });
        }
      });
    });
  }, [tapped, state]);

  useEffect(() => {
    if (
      renderState.meta === "input" ||
      renderState.meta === "suspense" ||
      renderState.meta === "resolveWin" ||
      renderState.meta === "resolveLose" ||
      renderState.meta === "resolveRekt" ||
      renderState.meta === "timeout" ||
      renderState.meta === "recover"
    ) {
      return;
    }

    if (preAction || state.isChoosing || state.phase === "choosing") {
      const frame = buildAwaitingChoiceFrame(
        timeLeftMs,
        choiceWindowMs,
        hesitationMs
      );
      applyStep(frame, selected ? "committed" : "awaitingChoice");
      return;
    }

    setRenderState((prev) => ({ ...prev, meta: "idleLoop" }));
  }, [
    preAction,
    hesitationMs,
    timeLeftMs,
    choiceWindowMs,
    selected,
    state.isChoosing,
    state.phase,
    renderState.meta,
  ]);

  useEffect(() => {
    if (renderState.meta !== "idleLoop") return;

    let cancelled = false;
    clearTimer();

    const loop = () => {
      if (cancelled) return;
      const frame = buildIdleFrame();
      applyStep(frame, "idleLoop");
      timerRef.current = setTimeout(loop, frame.durationMs);
    };

    loop();

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [renderState.meta]);

  const baseKey: BaseKey = `${renderState.headPose}-${renderState.armPose}`;
  const faceKey: FaceKey = `${renderState.headPose}-${renderState.face}`;

  const baseSrc = BASE_SPRITES[baseKey];
  const faceSrc = FACE_SPRITES[faceKey];
  const vfxSrc = renderState.vfx === "none" ? null : VFX_SPRITES[renderState.vfx];

  const wrapperClassName = [
    "tow-character-wrap",
    renderState.meta === "idleLoop" ? "is-idle" : "",
    renderState.meta === "awaitingChoice" ? "is-awaiting" : "",
    renderState.meta === "committed" ? "is-committed" : "",
    renderState.meta === "suspense" ? "is-suspense" : "",
    renderState.meta === "resolveWin" ? "is-win" : "",
    renderState.meta === "resolveLose" ? "is-lose" : "",
    renderState.meta === "resolveRekt" ? "is-rekt" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={`${className} ${wrapperClassName}`.trim()}
        style={{
          width,
          height,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label={`Tow character ${baseKey} ${renderState.face} ${renderState.vfx}`}
      >
        <img
          src={baseSrc}
          alt={`${baseKey}-base`}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        <img
          src={faceSrc}
          alt={`${faceKey}-face`}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {vfxSrc && (
          <img
            src={vfxSrc}
            alt={`${renderState.vfx}-vfx`}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
              userSelect: "none",
              opacity: renderState.vfx === "vfx-glitch" ? 0.94 : 1,
            }}
          />
        )}
      </div>

      <style jsx>{`
        .tow-character-wrap {
          will-change: transform, filter;
          transition:
            transform 150ms ease-out,
            filter 180ms ease-out;
        }

        .tow-character-wrap.is-idle {
          animation: towIdleFloat 3.2s ease-in-out infinite;
        }

        .tow-character-wrap.is-awaiting {
          transform: translateY(-2px);
        }

        .tow-character-wrap.is-committed {
          transform: translateY(-3px) scale(1.01);
        }

        .tow-character-wrap.is-suspense {
          transform: translateY(-1px) scale(1.005);
        }

        .tow-character-wrap.is-win {
          transform: translateY(-4px) scale(1.015);
          filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.08));
        }

        .tow-character-wrap.is-lose {
          transform: translateY(2px) scale(0.995);
        }

        .tow-character-wrap.is-rekt {
          transform: translateY(3px) scale(0.992);
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.12));
        }

        @keyframes towIdleFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </>
  );
}