export type GamePhase =
  | "idle"
  | "choosing"
  | "committed"
  | "resolving"
  | "gameOver";

export type HiddenCategory = "safe" | "swing" | "chaos";

export type OutcomeKind =
  | "winSmall"
  | "win"
  | "loseSmall"
  | "lose"
  | "rekt"
  | "glitch";

export type ModifierKind =
  | "shield"
  | "copium"
  | "degen"
  | "cursed"
  | "clarity"
  | "narrativeShift";

export type Choice = {
  id: string;
  label: string;
  whisper: string;
  category: HiddenCategory;
};

export type Modifier = {
  kind: ModifierKind;
  turnsLeft: number;
};

export type Outcome = {
  kind: OutcomeKind;
  headline: string;
  subtext: string;
  delta: number;
  appliedModifiers: Modifier[];
  removedModifiers: ModifierKind[];
  autoPicked?: boolean;
  currentWinStreak?: number;
  bestWinStreak?: number;
  streakBroken?: number;
  newBestWinStreak?: boolean;
};

export type RunMemory = {
  safePicks: number;
  swingPicks: number;
  chaosPicks: number;
  timeouts: number;
  winStreak: number;
  bestWinStreak: number;
  rektCount: number;
  glitchCount: number;
  bigWins: number;
  almostSaves: number;
};

export type GameState = {
  phase: GamePhase;
  turn: number;
  tired: number;
  bestRun?: number;
  choices: Choice[];
  selectedChoiceId: string | null;
  autoPicked: boolean;
  lastOutcome: Outcome | null;
  modifiers: Modifier[];
  memory: RunMemory;
  gameOver: boolean;
};

export type ResolveChoiceResult = {
  state: GameState;
  outcome: Outcome;
};

export const STARTING_TIRED = 18;
export const MAX_TIRED = 100;

const RECENT_LABEL_LIMIT = 15;

const SAFE_CHOICES = [
  "this looks fine",
  "I’ll be quick",
  "makes sense",
  "this checks out",
  "I trust this",
  "one more look",
  "it’s probably fine",
  "this seems normal",
  "I’ve seen this before",
  "could bounce here",
  "not a bad entry",
  "I’ll manage",
  "this should hold",
  "this might work",
  "this feels okay",
  "maybe this is clean",
  "looks contained",
  "this is reasonable",
];

const SWING_CHOICES = [
  "trust me bro",
  "chat is bullish",
  "this feels early",
  "maybe this is it",
  "they’re loading",
  "I know this setup",
  "just one more",
  "this time feels different",
  "it can’t get worse",
  "this is support",
  "I see the vision",
  "looks kinda based",
  "I mean… maybe",
  "this might print",
  "probably rotation",
  "I’ve seen worse",
  "this is interesting",
  "could be something",
];

const CHAOS_CHOICES = [
  "dev seems legit",
  "ngmi if I don’t",
  "full conviction",
  "I’m not overthinking",
  "this is the move",
  "I’m early",
  "it’s already down",
  "won’t take long",
  "lowkey bullish",
  "signal is there",
  "this is alpha",
  "I trust the vibe",
  "one last time",
  "I got this",
  "we send those",
  "I can recover",
  "it’ll reverse",
  "this one rips",
];

const WHISPERS = [
  "could be bait",
  "looks too clean",
  "chart is lying",
  "one tap changes it",
  "really?",
  "you sure?",
  "hm",
  "ok…",
  "maybe",
  "interesting",
  "go on",
  "last chance",
  "if you say so",
  "think about it",
  "right?",
  "wagmi?",
  "trust it?",
  "sure…",
  "seems fine",
  "why not",
  "not ideal",
  "early?",
];

const WIN_HEADLINES = [
  "MASSIVE W",
  "YOU COOKED",
  "PRINTING",
  "CLEAN PLAY",
  "THIS WORKED",
  "LOWKEY HUGE",
];

const WIN_SUBTEXT = [
  "Terrible process. Great result.",
  "Lowkey W. Very suspicious.",
  "That printed. Don’t ask why.",
  "You didn’t deserve that.",
  "Chat would call this based.",
  "Wrong logic. Right candle.",
  "This helped, which is concerning.",
];

const WIN_BIG_HEADLINES = [
  "WAGMI",
  "HUGE PRINT",
  "YOU HIT",
  "BASED CALL",
  "SUSPICIOUSLY HUGE",
];

const WIN_BIG_SUBTEXT = [
  "Awful logic. Unreal outcome.",
  "This should not have worked.",
  "You got away with one.",
  "The timeline rewarded nonsense.",
  "You were early. Somehow.",
  "This one belongs on the timeline.",
];

const LOSE_HEADLINES = [
  "NGMI",
  "BAD CALL",
  "NOT IT",
  "MARKET SAID NO",
  "YOU FUMBLED",
  "TOUGH LOOK",
];

const LOSE_SUBTEXT = [
  "Felt right. It wasn’t.",
  "Confidence was misplaced.",
  "You clicked with conviction.",
  "That looked smarter in your head.",
  "Very local top behavior.",
  "You trusted the vibe too hard.",
  "That one was mostly hope.",
];

const LOSE_BIG_HEADLINES = [
  "YOU GOT COOKED",
  "BRUTAL",
  "BAD READ",
  "THAT HURT",
  "TOUGH SCENE",
];

const LOSE_BIG_SUBTEXT = [
  "Liquidity was waiting for you.",
  "You walked into that one.",
  "That escalated quickly.",
  "This one’s on vibes.",
  "You saw it and still clicked.",
  "The market appreciated your donation.",
];

const REKT_HEADLINES = [
  "REKT",
  "DISASTER",
  "YOU GOT FARMED",
  "RUGGED YOURSELF",
  "OBLITERATED",
  "TOTAL COLLAPSE",
];

const REKT_SUBTEXT = [
  "Fully degen. Fully punished.",
  "You aped. It aped back.",
  "Exit liquidity behavior.",
  "Everything went wrong.",
  "That one belongs on the timeline.",
  "This was avoidable. Probably.",
  "You committed to the bit.",
];

const GLITCH_HEADLINES = [
  "???",
  "TIMELINE SHIFT",
  "GLITCH",
  "DESYNC",
  "REALITY FORK",
];

const GLITCH_SUBTEXT = [
  "No model covers this.",
  "Explain this to CT.",
  "Reality forked.",
  "This wasn’t in the thread.",
  "The market broke character.",
  "Nothing about this was normal.",
];

const RECENT_USED_LABELS: string[] = [];

function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weightedPick<T>(items: Array<{ value: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }

  return items[items.length - 1].value;
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tow-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function modifier(kind: ModifierKind, turnsLeft: number): Modifier {
  return { kind, turnsLeft };
}

function hasModifier(state: GameState, kind: ModifierKind) {
  return state.modifiers.some((m) => m.kind === kind && m.turnsLeft > 0);
}

function decrementModifiers(modifiers: Modifier[]): {
  nextModifiers: Modifier[];
  removed: ModifierKind[];
} {
  const removed: ModifierKind[] = [];
  const nextModifiers: Modifier[] = [];

  for (const item of modifiers) {
    const nextTurns = item.turnsLeft - 1;
    if (nextTurns <= 0) {
      removed.push(item.kind);
    } else {
      nextModifiers.push({ ...item, turnsLeft: nextTurns });
    }
  }

  return { nextModifiers, removed };
}

function mergeModifiers(existing: Modifier[], additions: Modifier[]): Modifier[] {
  const map = new Map<ModifierKind, Modifier>();

  for (const item of existing) {
    map.set(item.kind, { ...item });
  }

  for (const add of additions) {
    const current = map.get(add.kind);
    if (!current || add.turnsLeft > current.turnsLeft) {
      map.set(add.kind, { ...add });
    }
  }

  return Array.from(map.values());
}

function recordRecentLabel(label: string) {
  RECENT_USED_LABELS.unshift(label);
  if (RECENT_USED_LABELS.length > RECENT_LABEL_LIMIT) {
    RECENT_USED_LABELS.length = RECENT_LABEL_LIMIT;
  }
}

function pickUniqueLabel(pool: string[], localUsed: Set<string>): string {
  const candidates = pool.filter(
    (label) => !localUsed.has(label) && !RECENT_USED_LABELS.includes(label)
  );

  const fallback = pool.filter((label) => !localUsed.has(label));
  const source =
    candidates.length > 0 ? candidates : fallback.length > 0 ? fallback : pool;

  const chosen = sample(source);
  localUsed.add(chosen);
  return chosen;
}

export function createInitialState(bestRun = 0): GameState {
  return {
    phase: "idle",
    turn: 1,
    tired: STARTING_TIRED,
    bestRun,
    choices: [],
    selectedChoiceId: null,
    autoPicked: false,
    lastOutcome: null,
    modifiers: [],
    memory: {
      safePicks: 0,
      swingPicks: 0,
      chaosPicks: 0,
      timeouts: 0,
      winStreak: 0,
      bestWinStreak: 0,
      rektCount: 0,
      glitchCount: 0,
      bigWins: 0,
      almostSaves: 0,
    },
    gameOver: false,
  };
}

export function generateChoices(state: GameState): Choice[] {
  const used = new Set<string>();

  const choices: Choice[] = [
    {
      id: generateId(),
      label: pickUniqueLabel(SAFE_CHOICES, used),
      whisper: sample(WHISPERS),
      category: "safe",
    },
    {
      id: generateId(),
      label: pickUniqueLabel(SWING_CHOICES, used),
      whisper: sample(WHISPERS),
      category: "swing",
    },
    {
      id: generateId(),
      label: pickUniqueLabel(CHAOS_CHOICES, used),
      whisper: sample(WHISPERS),
      category: "chaos",
    },
  ];

  return shuffle(choices);
}

function getMarketBand(tired: number) {
  if (tired < 35) return "stable";
  if (tired < 70) return "unstable";
  return "panic";
}

function getOutcomeWeights(
  category: HiddenCategory,
  state: GameState
): Array<{ value: OutcomeKind; weight: number }> {
  const band = getMarketBand(state.tired);

  let weights: Array<{ value: OutcomeKind; weight: number }>;

  if (category === "safe") {
    weights =
      band === "panic"
        ? [
            { value: "winSmall", weight: 19 },
            { value: "win", weight: 5 },
            { value: "loseSmall", weight: 34 },
            { value: "lose", weight: 20 },
            { value: "rekt", weight: 8 },
            { value: "glitch", weight: 2 },
          ]
        : band === "unstable"
        ? [
            { value: "winSmall", weight: 24 },
            { value: "win", weight: 7 },
            { value: "loseSmall", weight: 31 },
            { value: "lose", weight: 13 },
            { value: "rekt", weight: 4 },
            { value: "glitch", weight: 2 },
          ]
        : [
            { value: "winSmall", weight: 28 },
            { value: "win", weight: 8 },
            { value: "loseSmall", weight: 27 },
            { value: "lose", weight: 9 },
            { value: "rekt", weight: 2 },
            { value: "glitch", weight: 2 },
          ];
  } else if (category === "swing") {
    weights =
      band === "panic"
        ? [
            { value: "winSmall", weight: 18 },
            { value: "win", weight: 13 },
            { value: "loseSmall", weight: 24 },
            { value: "lose", weight: 21 },
            { value: "rekt", weight: 12 },
            { value: "glitch", weight: 5 },
          ]
        : [
            { value: "winSmall", weight: 22 },
            { value: "win", weight: 16 },
            { value: "loseSmall", weight: 24 },
            { value: "lose", weight: 18 },
            { value: "rekt", weight: 8 },
            { value: "glitch", weight: 4 },
          ];
  } else {
    weights =
      band === "panic"
        ? [
            { value: "winSmall", weight: 12 },
            { value: "win", weight: 17 },
            { value: "loseSmall", weight: 17 },
            { value: "lose", weight: 23 },
            { value: "rekt", weight: 22 },
            { value: "glitch", weight: 9 },
          ]
        : [
            { value: "winSmall", weight: 14 },
            { value: "win", weight: 20 },
            { value: "loseSmall", weight: 18 },
            { value: "lose", weight: 18 },
            { value: "rekt", weight: 14 },
            { value: "glitch", weight: 8 },
          ];
  }

  if (hasModifier(state, "clarity")) {
    weights = weights.map((entry) => {
      if (entry.value === "winSmall" || entry.value === "win") {
        return { ...entry, weight: entry.weight + 3 };
      }
      if (entry.value === "rekt") {
        return { ...entry, weight: Math.max(1, entry.weight - 4) };
      }
      if (entry.value === "lose") {
        return { ...entry, weight: Math.max(1, entry.weight - 2) };
      }
      return entry;
    });
  }

  if (hasModifier(state, "cursed")) {
    weights = weights.map((entry) => {
      if (entry.value === "lose" || entry.value === "rekt") {
        return { ...entry, weight: entry.weight + 4 };
      }
      if (entry.value === "winSmall" || entry.value === "win") {
        return { ...entry, weight: Math.max(1, entry.weight - 2) };
      }
      return entry;
    });
  }

  if (hasModifier(state, "degen")) {
    weights = weights.map((entry) => {
      if (
        entry.value === "win" ||
        entry.value === "rekt" ||
        entry.value === "glitch"
      ) {
        return { ...entry, weight: entry.weight + 4 };
      }
      if (entry.value === "winSmall" || entry.value === "loseSmall") {
        return { ...entry, weight: Math.max(1, entry.weight - 2) };
      }
      return entry;
    });
  }

  if (hasModifier(state, "copium")) {
    weights = weights.map((entry) => {
      if (entry.value === "lose" || entry.value === "rekt") {
        return { ...entry, weight: Math.max(1, entry.weight - 3) };
      }
      if (entry.value === "win") {
        return { ...entry, weight: Math.max(1, entry.weight - 2) };
      }
      return entry;
    });
  }

  if (hasModifier(state, "narrativeShift") && category !== "chaos") {
    weights = weights.map((entry) => {
      if (
        entry.value === "glitch" ||
        entry.value === "win" ||
        entry.value === "rekt"
      ) {
        return { ...entry, weight: entry.weight + 2 };
      }
      return entry;
    });
  }

  return weights;
}

function buildBaseOutcome(kind: OutcomeKind): Outcome {
  switch (kind) {
    case "winSmall":
      return {
        kind,
        headline: sample(WIN_HEADLINES),
        subtext: sample(WIN_SUBTEXT),
        delta: -randInt(5, 9),
        appliedModifiers: [],
        removedModifiers: [],
      };
    case "win":
      return {
        kind,
        headline: sample(WIN_BIG_HEADLINES),
        subtext: sample(WIN_BIG_SUBTEXT),
        delta: -randInt(10, 18),
        appliedModifiers: [],
        removedModifiers: [],
      };
    case "loseSmall":
      return {
        kind,
        headline: sample(LOSE_HEADLINES),
        subtext: sample(LOSE_SUBTEXT),
        delta: randInt(5, 9),
        appliedModifiers: [],
        removedModifiers: [],
      };
    case "lose":
      return {
        kind,
        headline: sample(LOSE_BIG_HEADLINES),
        subtext: sample(LOSE_BIG_SUBTEXT),
        delta: randInt(10, 16),
        appliedModifiers: [],
        removedModifiers: [],
      };
    case "rekt":
      return {
        kind,
        headline: sample(REKT_HEADLINES),
        subtext: sample(REKT_SUBTEXT),
        delta: randInt(18, 25),
        appliedModifiers: [],
        removedModifiers: [],
      };
    case "glitch":
      return {
        kind,
        headline: sample(GLITCH_HEADLINES),
        subtext: sample(GLITCH_SUBTEXT),
        delta: randInt(-12, 14),
        appliedModifiers: [],
        removedModifiers: [],
      };
  }
}

function maybeApplySpecialEffect(
  state: GameState,
  choice: Choice,
  outcome: Outcome
): Outcome {
  const appliedModifiers: Modifier[] = [];
  let next = { ...outcome };

  const wouldEndRun = state.tired + next.delta >= MAX_TIRED;
  const lateRun = state.turn >= 9 || state.tired >= 72;

  // Almost-win / clutch-save mechanic. Rare enough to feel earned, strong enough
  // to make players believe the next run could be the one.
  if (wouldEndRun && lateRun && Math.random() < 0.18) {
    next = {
      ...next,
      kind: Math.random() < 0.55 ? "glitch" : "win",
      headline: sample(["BARELY ALIVE", "ONE HP", "ALMOST REKT", "CLUTCH SAVE"]),
      subtext: sample([
        "You were one tap from cooked. The timeline blinked.",
        "That should have ended it. Somehow it did not.",
        "The phone almost hit the floor.",
        "You survived by the worst possible logic.",
      ]),
      delta: -randInt(4, 12),
    };
    appliedModifiers.push(modifier("copium", 1));
  }

  const rareRoll = Math.random();

  if (rareRoll < 0.03) {
    next = {
      ...next,
      kind: "glitch",
      headline: "TIMELINE FORK",
      subtext: "The market changed its mind mid-collapse.",
      delta: -randInt(10, 18),
    };
  } else if (rareRoll < 0.06) {
    next = {
      ...next,
      headline: "AIRDROP",
      subtext: "Free relief. Don’t get used to it.",
      delta: -randInt(12, 20),
      kind: next.delta > 0 ? "win" : next.kind,
    };
  }

  if (choice.category === "chaos" && next.kind === "win") {
    if (Math.random() < 0.34) {
      appliedModifiers.push(modifier("degen", 2));
    }
  }

  if ((next.kind === "lose" || next.kind === "rekt") && Math.random() < 0.28) {
    appliedModifiers.push(modifier("cursed", 1));
  }

  if ((next.kind === "winSmall" || next.kind === "win") && Math.random() < 0.2) {
    appliedModifiers.push(modifier("clarity", 1));
  }

  if (next.kind === "loseSmall" && Math.random() < 0.18) {
    appliedModifiers.push(modifier("copium", 2));
  }

  if (next.kind === "rekt" && Math.random() < 0.22) {
    appliedModifiers.push(modifier("narrativeShift", 2));
  }

  next.appliedModifiers = appliedModifiers;

  return next;
}

function applyModifierEffects(state: GameState, outcome: Outcome): Outcome {
  let next = { ...outcome };

  if (hasModifier(state, "shield") && next.delta > 0) {
    next = {
      ...next,
      subtext: `${next.subtext} Shield softened the hit.`,
      delta: Math.max(1, Math.floor(next.delta * 0.5)),
      removedModifiers: [...next.removedModifiers, "shield"],
    };
  }

  if (hasModifier(state, "copium")) {
    if (next.delta > 0) {
      next = {
        ...next,
        delta: Math.max(1, next.delta - 3),
      };
    } else if (next.delta < 0) {
      next = {
        ...next,
        delta: Math.min(-1, next.delta + 2),
      };
    }
  }

  return next;
}

function updateMemory(
  memory: RunMemory,
  choice: Choice,
  outcome: Outcome,
  wasAutoPicked: boolean
): RunMemory {
  const next: RunMemory = { ...memory };

  if (choice.category === "safe") next.safePicks += 1;
  if (choice.category === "swing") next.swingPicks += 1;
  if (choice.category === "chaos") next.chaosPicks += 1;
  if (wasAutoPicked) next.timeouts += 1;

  const isWin = outcome.kind === "win" || outcome.kind === "winSmall";

  if (isWin) {
    next.winStreak += 1;
  } else {
    next.winStreak = 0;
  }

  if (next.winStreak > next.bestWinStreak) {
    next.bestWinStreak = next.winStreak;
  }

  if (outcome.kind === "rekt") {
    next.rektCount += 1;
    next.winStreak = 0;
  }

  if (outcome.kind === "glitch") {
    next.glitchCount += 1;
  }

  if (outcome.kind === "win") {
    next.bigWins += 1;
  }

  if (outcome.headline === "BARELY ALIVE" || outcome.headline === "ONE HP" || outcome.headline === "ALMOST REKT" || outcome.headline === "CLUTCH SAVE") {
    next.almostSaves += 1;
  }

  return next;
}

export function beginChoosing(state: GameState): GameState {
  return {
    ...state,
    phase: "choosing",
    choices: generateChoices(state),
    selectedChoiceId: null,
    autoPicked: false,
  };
}

export function commitChoice(
  state: GameState,
  choiceId: string,
  wasAutoPicked = false
): GameState {
  return {
    ...state,
    phase: "committed",
    selectedChoiceId: choiceId,
    autoPicked: wasAutoPicked,
  };
}

export function resolveChoice(
  state: GameState,
  choiceId: string,
  wasAutoPicked = false
): ResolveChoiceResult {
  const choice = state.choices.find((item) => item.id === choiceId);
  if (!choice) {
    throw new Error(`Choice not found: ${choiceId}`);
  }

  recordRecentLabel(choice.label);

  const weights = getOutcomeWeights(choice.category, state);
  const pickedKind = weightedPick(weights);

  const { nextModifiers: decayedModifiers, removed } = decrementModifiers(
    state.modifiers
  );

  let outcome = buildBaseOutcome(pickedKind);
  outcome = maybeApplySpecialEffect(
    { ...state, modifiers: decayedModifiers },
    choice,
    outcome
  );
  outcome = applyModifierEffects(
    { ...state, modifiers: decayedModifiers },
    outcome
  );
  outcome.autoPicked = wasAutoPicked;
  outcome.removedModifiers = [...outcome.removedModifiers, ...removed];

  const mergedModifiers = mergeModifiers(decayedModifiers, outcome.appliedModifiers);

  // Near-miss pressure: sometimes a bad hit leaves the player barely alive instead
  // of ending the run. This creates the “one more run” moment without making
  // early turns feel fake.
  if (state.turn >= 10 && state.tired + outcome.delta >= MAX_TIRED && Math.random() < 0.1) {
    outcome = {
      ...outcome,
      kind: "lose",
      headline: sample(["ONE TAP LEFT", "NOT DEAD YET", "HANGING ON"]),
      subtext: sample([
        "You should be gone. Somehow you are still scrolling.",
        "The run is alive by a thread.",
        "The market missed the final punch.",
      ]),
      delta: Math.max(1, 96 - state.tired),
    };
  }

  const nextTired = clamp(state.tired + outcome.delta, 0, MAX_TIRED);
  const memory = updateMemory(state.memory, choice, outcome, wasAutoPicked);
  const gameOver = nextTired >= MAX_TIRED;

  const streakBroken =
    state.memory.winStreak > 0 && memory.winStreak === 0
      ? state.memory.winStreak
      : undefined;

  outcome = {
    ...outcome,
    currentWinStreak: memory.winStreak,
    bestWinStreak: memory.bestWinStreak,
    streakBroken,
    newBestWinStreak:
      memory.winStreak > 0 &&
      memory.winStreak === memory.bestWinStreak &&
      memory.bestWinStreak > state.memory.bestWinStreak,
  };

  const nextState: GameState = {
    ...state,
    phase: gameOver ? "gameOver" : "resolving",
    tired: nextTired,
    selectedChoiceId: choiceId,
    autoPicked: wasAutoPicked,
    lastOutcome: outcome,
    modifiers: mergedModifiers,
    memory,
    gameOver,
  };

  return {
    state: nextState,
    outcome,
  };
}

export function advanceAfterResolve(state: GameState): GameState {
  if (state.gameOver) {
    return state;
  }

  return {
    ...state,
    phase: "idle",
    turn: state.turn + 1,
  };
}

export function restartRun(bestRun = 0): GameState {
  return createInitialState(bestRun);
}

export function getMarketState(state: GameState): {
  icon: string;
  label: string;
  color: string;
} {
  if (state.tired < 35) {
    return { icon: "📱", label: "phone calm", color: "text-emerald-500" };
  }

  if (state.tired < 55) {
    return { icon: "👀", label: "trap watch", color: "text-amber-500" };
  }

  if (state.tired < 78) {
    return { icon: "🫠", label: "fake pump", color: "text-orange-500" };
  }

  return { icon: "⚠️", label: "one tap zone", color: "text-red-500" };
}

export function getRunTitle(state: GameState): string {
  const { memory, turn } = state;

  if (memory.almostSaves >= 2) return "The One HP Survivor";
  if (memory.timeouts >= 3) return "The Hesitant";
  if (memory.chaosPicks >= 6) return "The Degen";
  if (memory.bigWins >= 3) return "The Lucky";
  if (memory.safePicks >= 6) return "The Survivor";
  if (memory.glitchCount >= 2) return "The Timeline Casualty";
  if (memory.rektCount >= 2) return "The Exit Liquidity";
  if (memory.bestWinStreak >= 5) return "The Heater";
  if (turn >= 18) return "The Endurance Poster";

  return "The Participant";
}

export function getGameOverHeadline(state: GameState): string {
  if (state.memory.almostSaves >= 2) return "SO CLOSE";
  if (state.memory.rektCount >= 2) return "EVENTUALLY REKT";
  if (state.memory.timeouts >= 3) return "TOO SLOW";
  return "EVENTUALLY NGMI";
}

export function getGameOverSubtext(state: GameState): string {
  const title = getRunTitle(state);
  return `You lasted ${state.turn} turns. ${title}.`;
}

export function getStreakLabel(streak: number): string {
  if (streak <= 0) return "Cold";
  if (streak === 1) return "Alive";
  if (streak === 2) return "Back-to-back";
  if (streak === 3) return "Heating up";
  if (streak <= 5) return "Heater";
  return "Unreal heater";
}