import {
  ACTIONS,
  RANDOM_EVENTS,
  MARKET_MODIFIERS,
  BEHAVIOR_ARCS,
  RARITY_WEIGHTS,
  TWIST_LINES,
  COLLAPSE_CAUSES,
  END_TITLES,
  OutcomeResult as ContentOutcomeResult,
  MarketState,
  Mood,
  VFXType,
  Rarity,
} from './content';

export interface GameOutcome {
  id: string;
  mainText: string;
  subText?: string;
  effects: {
    tired: number;
    sanity: number;
    momentum: number;
    clout: number;
    luck: number;
  };
  mood: Mood;
  vfx: VFXType;
  rarity: Rarity;
  eventTriggerChance?: number;
}

export interface ActiveEvent {
  id: string;
  name: string;
  description: string;
  duration: number;
  effects: {
    tiredModifier?: number;
    luckModifier?: number;
    sanityModifier?: number;
    momentumModifier?: number;
  };
  vfx: VFXType;
}

export interface GameState {
  turn: number;
  tired: number;
  sanity: number;
  momentum: number;
  clout: number;
  luck: number;

  marketState: MarketState;

  lastOutcome?: GameOutcome;
  activeEvent?: ActiveEvent;
  eventTurnsRemaining: number;

  actionHistory: string[];
  recentOutcomeIds: string[];

  gameOver: boolean;
}

export function createInitialState(): GameState {
  return {
    turn: 0,
    tired: randomInt(0, 10),
    sanity: 50,
    momentum: 0,
    clout: 0,
    luck: 0,

    marketState: randomFrom<MarketState>(['bull', 'bear', 'crab']),

    lastOutcome: undefined,
    activeEvent: undefined,
    eventTurnsRemaining: 0,

    actionHistory: [],
    recentOutcomeIds: [],

    gameOver: false,
  };
}

export function selectRandomActions(state: GameState): string[] {
  const allIds = ACTIONS.map((a) => a.id);

  // Avoid repeating the exact last few actions too aggressively.
  const recent = new Set(state.actionHistory.slice(-2));
  const preferred = allIds.filter((id) => !recent.has(id));
  const fallback = allIds.filter((id) => recent.has(id));

  const shuffledPreferred = shuffle(preferred);
  const shuffledFallback = shuffle(fallback);

  const combined = [...shuffledPreferred, ...shuffledFallback];

  return combined.slice(0, 3);
}

export function generateOutcome(
  state: GameState,
  actionId: string
): GameOutcome {
  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action) {
    throw new Error(`Invalid action: ${actionId}`);
  }

  let pool = [...action.baseOutcomes];

  // Anti-repetition: try not to reuse the exact same recent outcome.
  const filtered = pool.filter((o, index) => {
    const id = makeOutcomeId(actionId, index, o.text, o.subText);
    return !state.recentOutcomeIds.includes(id);
  });

  if (filtered.length > 0) {
    pool = filtered;
  }

  const weightedPool = buildWeightedOutcomePool(pool);
  let selected = randomFrom(weightedPool);

  // Behavior-aware override chance.
  const behaviorLine = getBehaviorLine(state, actionId);
  if (behaviorLine && Math.random() < 0.6) {
    selected = {
      ...selected,
      subText: behaviorLine,
    };
  }

  // Near-miss / twist line chance.
  if (Math.random() < 0.18) {
    selected = {
      ...selected,
      subText: randomFrom(TWIST_LINES),
    };
  }

  // Apply market modifiers.
  const market = MARKET_MODIFIERS[state.marketState];
  const tiredDelta =
    selected.tiredDelta + (market?.tiredMod ?? 0) + getEventTiredMod(state);
  const sanityDelta =
    (selected.sanityDelta ?? 0) +
    (market?.sanityMod ?? 0) +
    getEventSanityMod(state);
  const momentumDelta =
    (selected.momentumDelta ?? 0) + getEventMomentumMod(state);
  const cloutDelta = selected.cloutDelta ?? 0;
  const luckDelta = (selected.luckDelta ?? 0) + getEventLuckMod(state);

  const outcomeIndex = action.baseOutcomes.findIndex(
    (o) => o.text === selected.text && o.subText === selected.subText
  );

  return {
    id: makeOutcomeId(
      actionId,
      outcomeIndex >= 0 ? outcomeIndex : randomInt(0, 9999),
      selected.text,
      selected.subText
    ),
    mainText: selected.text,
    subText: selected.subText,
    effects: {
      tired: tiredDelta,
      sanity: sanityDelta,
      momentum: momentumDelta,
      clout: cloutDelta,
      luck: luckDelta,
    },
    mood: selected.mood,
    vfx: selected.vfx,
    rarity: selected.rarity,
    eventTriggerChance: selected.eventTriggerChance,
  };
}

export function updateState(
  state: GameState,
  actionId: string,
  outcome: GameOutcome
): GameState {
  const nextTurn = state.turn + 1;

  const nextState: GameState = {
    ...state,
    turn: nextTurn,
    tired: clamp(state.tired + outcome.effects.tired, 0, 100),
    sanity: clamp(state.sanity + outcome.effects.sanity, 0, 100),
    momentum: clamp(state.momentum + outcome.effects.momentum, -10, 10),
    clout: clamp(state.clout + outcome.effects.clout, 0, 100),
    luck: clamp(state.luck + outcome.effects.luck, -10, 10),

    lastOutcome: outcome,
    actionHistory: [...state.actionHistory, actionId].slice(-12),
    recentOutcomeIds: [outcome.id, ...state.recentOutcomeIds].slice(0, 10),

    gameOver: false,
  };

  // Handle event lifecycle.
  if (nextState.activeEvent) {
    nextState.eventTurnsRemaining -= 1;
    if (nextState.eventTurnsRemaining <= 0) {
      nextState.activeEvent = undefined;
      nextState.eventTurnsRemaining = 0;
    }
  }

  // Trigger a new event if none is active.
  const triggerChance =
    outcome.eventTriggerChance ??
    (nextTurn > 8 ? 0.22 : nextTurn > 4 ? 0.18 : 0.12);

  if (!nextState.activeEvent && Math.random() < triggerChance) {
    const event = randomFrom(RANDOM_EVENTS);
    nextState.activeEvent = { ...event };
    nextState.eventTurnsRemaining = event.duration;
  }

  if (nextState.tired >= 100) {
    nextState.gameOver = true;
  }

  return nextState;
}

export function getCollapseCause(state: GameState): string {
  const lastAction = state.actionHistory[state.actionHistory.length - 1];
  const pool =
    (lastAction && COLLAPSE_CAUSES[lastAction]) || COLLAPSE_CAUSES.default;

  return randomFrom(pool);
}

export function getEndTitle(state: GameState): string {
  // Bias based on play style.
  const counts = countActions(state.actionHistory);

  if ((counts['buy-dip'] ?? 0) >= 3) {
    return randomFrom([
      'Certified Bottom Buyer',
      'Liquidity Provider (To Pain)',
      'Hope-Funded Trader',
      'Certified Near-Miss',
      'Bottom Caller, Top Exit',
    ]);
  }

  if ((counts['check-portfolio'] ?? 0) >= 3 || (counts['open-telegram'] ?? 0) >= 3) {
    return randomFrom([
      'Doom Scroll Technician',
      'Chart Gazer Supreme',
      'Portfolio Philosopher',
      'Signal Collector',
      'Thread Reader, Profit Avoider',
    ]);
  }

  if ((counts['go-sleep'] ?? 0) >= 3) {
    return randomFrom([
      'Sleep Cycle Survivor',
      'Sleep-Deprived Visionary',
      'Technically Still Here',
      'Almost Made It',
    ]);
  }

  if ((counts['touch-grass'] ?? 0) >= 3) {
    return randomFrom([
      'Grass-Touching Heretic',
      'Clarity Avoider',
      'Rekt but Reflective',
      'Permanent Student',
    ]);
  }

  if ((counts['post-x'] ?? 0) >= 3) {
    return randomFrom([
      'Professional Cope Analyst',
      'Clout Over Coins',
      'Content Was the Exit',
      'Narrative Casualty',
    ].filter(Boolean));
  }

  if (state.turn >= 20) {
    return randomFrom([
      'Diamond Hands (Emotionally)',
      'Market Victim',
      'Temporary Genius',
      'WAGMI Believer',
      'Emotionally Margin Called',
      'The One Who Held',
    ]);
  }

  return randomFrom(END_TITLES);
}

export function formatShareResult(state: GameState): string {
  const cause = getCollapseCause(state);
  const title = getEndTitle(state);

  return `Too Tired to Win

${title}
"${cause}"

Survived: ${state.turn} turns

You knew better. You still did it.

#TOW`;
}

/* ------------------------------ helpers ------------------------------ */

function buildWeightedOutcomePool(
  outcomes: ContentOutcomeResult[]
): ContentOutcomeResult[] {
  return outcomes.flatMap((outcome) => {
    const weight = RARITY_WEIGHTS[outcome.rarity] ?? 1;
    return Array.from({ length: weight }, () => outcome);
  });
}

function getBehaviorLine(state: GameState, actionId: string): string | null {
  const recent = state.actionHistory.slice(-5);

  const bottomBuyerCount = recent.filter((a) => a === 'buy-dip').length;
  if (actionId === 'buy-dip' && bottomBuyerCount >= BEHAVIOR_ARCS['bottom-buyer'].triggerCount) {
    return randomFrom(BEHAVIOR_ARCS['bottom-buyer'].injectedLines);
  }

  const sleepCount = recent.filter((a) => a === 'go-sleep').length;
  if (actionId === 'go-sleep' && sleepCount >= BEHAVIOR_ARCS['sleep-gambler'].triggerCount) {
    return randomFrom(BEHAVIOR_ARCS['sleep-gambler'].injectedLines);
  }

  const grassCount = recent.filter((a) => a === 'touch-grass').length;
  if (actionId === 'touch-grass' && grassCount >= BEHAVIOR_ARCS['grass-escape'].triggerCount) {
    return randomFrom(BEHAVIOR_ARCS['grass-escape'].injectedLines);
  }

  const doomScrollCount = recent.filter(
    (a) => a === 'check-portfolio' || a === 'open-telegram'
  ).length;
  if (
    (actionId === 'check-portfolio' || actionId === 'open-telegram') &&
    doomScrollCount >= BEHAVIOR_ARCS['doom-scroller'].triggerCount
  ) {
    return randomFrom(BEHAVIOR_ARCS['doom-scroller'].injectedLines);
  }

  const cloutCount = recent.filter((a) => a === 'post-x').length;
  if (actionId === 'post-x' && cloutCount >= BEHAVIOR_ARCS['clout-farmer'].triggerCount) {
    return randomFrom(BEHAVIOR_ARCS['clout-farmer'].injectedLines);
  }

  return null;
}

function getEventTiredMod(state: GameState): number {
  return state.activeEvent?.effects?.tiredModifier ?? 0;
}

function getEventSanityMod(state: GameState): number {
  return state.activeEvent?.effects?.sanityModifier ?? 0;
}

function getEventMomentumMod(state: GameState): number {
  return state.activeEvent?.effects?.momentumModifier ?? 0;
}

function getEventLuckMod(state: GameState): number {
  return state.activeEvent?.effects?.luckModifier ?? 0;
}

function makeOutcomeId(
  actionId: string,
  index: number,
  text: string,
  subText?: string
): string {
  return `${actionId}-${index}-${slugify(text)}-${slugify(subText ?? '')}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function countActions(actions: string[]): Record<string, number> {
  return actions.reduce<Record<string, number>>((acc, action) => {
    acc[action] = (acc[action] ?? 0) + 1;
    return acc;
  }, {});
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}