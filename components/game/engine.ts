import {
  OutcomeResult, Mood, MarketState, VFXType, Rarity,
  ACTIONS, MARKET_MODIFIERS, BEHAVIOR_ARCS, RANDOM_EVENTS,
  TONE_VARIANTS, TWIST_LINES, RARITY_WEIGHTS, EventDef,
  COLLAPSE_CAUSES, END_TITLES
} from './content';

export interface GameState {
  tired: number;
  hiddenStats: { luck: number; sanity: number; momentum: number; clout: number; };
  marketState: MarketState;
  turn: number;
  actionHistory: string[];
  activeArcs: Set<string>;
  activeEvent: EventDef | null;
  eventTurnsRemaining: number;
  gameOver: boolean;
  lastOutcome: OutcomeResult | null;
  difficultyMultiplier: number;
}

export function createInitialState(): GameState {
  const marketStates: MarketState[] = ['bull', 'bear', 'crab'];
  return {
    tired: Math.floor(Math.random() * 11),
    hiddenStats: { luck: 0, sanity: 50, momentum: 0, clout: 0 },
    marketState: marketStates[Math.floor(Math.random() * marketStates.length)],
    turn: 0,
    actionHistory: [],
    activeArcs: new Set(),
    activeEvent: null,
    eventTurnsRemaining: 0,
    gameOver: false,
    lastOutcome: null,
    difficultyMultiplier: 1,
  };
}

export function selectRandomActions(state: GameState, count: number = 3): string[] {
  const available = ACTIONS.map(a => a.id);
  const lastTurnActions = state.actionHistory.slice(-3);
  const filtered = available.filter(id => !lastTurnActions.includes(id));
  const pool = filtered.length >= count ? filtered : available;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateOutcome(state: GameState, actionId: string): OutcomeResult {
  const action = ACTIONS.find(a => a.id === actionId);
  if (!action) throw new Error(`Unknown action: ${actionId}`);

  const baseOutcome = selectWeightedOutcome(action.baseOutcomes);
  const marketMod = MARKET_MODIFIERS[state.marketState];
  let tiredDelta = baseOutcome.tiredDelta + marketMod.tiredMod;
  let sanityDelta = (baseOutcome.sanityDelta || 0) + marketMod.sanityMod;

  if (state.activeEvent) {
    tiredDelta += state.activeEvent.effects.tiredModifier || 0;
    sanityDelta += state.activeEvent.effects.sanityModifier || 0;
  }

  const difficultyScale = 1 + (state.turn * 0.02);
  if (tiredDelta > 0) tiredDelta = Math.ceil(tiredDelta * difficultyScale);

  const arcInjection = getBehaviorArcLine(state, actionId);
  let text = baseOutcome.text;
  let subText = baseOutcome.subText;

  if (arcInjection && Math.random() < 0.4) subText = arcInjection;

  const toneKeys = Object.keys(TONE_VARIANTS) as Array<keyof typeof TONE_VARIANTS>;
  const selectedTone = toneKeys[Math.floor(Math.random() * toneKeys.length)];
  const tonePrefixes = TONE_VARIANTS[selectedTone];
  const prefix = Math.random() < 0.3 ? tonePrefixes[Math.floor(Math.random() * tonePrefixes.length)] : '';

  if (prefix && !text.startsWith(prefix)) {
    text = prefix + text.charAt(0).toLowerCase() + text.slice(1);
  }

  if (baseOutcome.rarity === 'epic' || baseOutcome.rarity === 'legendary') {
    const twist = TWIST_LINES[Math.floor(Math.random() * TWIST_LINES.length)];
    if (!subText) subText = twist;
    else subText = `${subText} ${twist}.`;
  }

  return {
    ...baseOutcome, text, subText, tiredDelta, sanityDelta,
    momentumDelta: (baseOutcome.momentumDelta || 0) + (state.activeEvent?.effects.momentumModifier || 0),
  };
}

function selectWeightedOutcome(outcomes: OutcomeResult[]): OutcomeResult {
  const weighted: OutcomeResult[] = [];
  for (const outcome of outcomes) {
    const weight = RARITY_WEIGHTS[outcome.rarity];
    for (let i = 0; i < weight; i++) weighted.push(outcome);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function getBehaviorArcLine(state: GameState, actionId: string): string | null {
  const arcMap: Record<string, string> = {
    'buy-dip': 'bottom-buyer', 'go-sleep': 'sleep-gambler',
    'touch-grass': 'grass-escape', 'check-portfolio': 'doom-scroller',
    'open-telegram': 'doom-scroller', 'post-x': 'clout-farmer',
  };
  const arcId = arcMap[actionId];
  if (!arcId) return null;
  const recentCount = state.actionHistory.slice(-5).filter(id => id === actionId).length;
  const arc = BEHAVIOR_ARCS[arcId];
  if (recentCount >= arc.triggerCount - 1) {
    return arc.injectedLines[Math.floor(Math.random() * arc.injectedLines.length)];
  }
  return null;
}

export function updateState(state: GameState, actionId: string, outcome: OutcomeResult): GameState {
  const newState: GameState = {
    ...state,
    tired: Math.max(0, state.tired + outcome.tiredDelta),
    hiddenStats: {
      luck: clamp(state.hiddenStats.luck + (outcome.luckDelta ?? 0), -2, 2),
      sanity: clamp(state.hiddenStats.sanity + (outcome.sanityDelta ?? 0), 0, 100),
      momentum: clamp(state.hiddenStats.momentum + (outcome.momentumDelta ?? 0), -3, 3),
      clout: clamp(state.hiddenStats.clout + (outcome.cloutDelta ?? 0), 0, 50),
    },
    turn: state.turn + 1,
    actionHistory: [...state.actionHistory, actionId].slice(-10),
    lastOutcome: outcome,
    difficultyMultiplier: 1 + ((state.turn + 1) * 0.02),
  };

  newState.activeArcs = new Set(state.activeArcs);
  for (const [arcId, arc] of Object.entries(BEHAVIOR_ARCS)) {
    const count = newState.actionHistory.filter(id => {
      if (arcId === 'bottom-buyer') return id === 'buy-dip';
      if (arcId === 'sleep-gambler') return id === 'go-sleep';
      if (arcId === 'grass-escape') return id === 'touch-grass';
      if (arcId === 'doom-scroller') return id === 'check-portfolio' || id === 'open-telegram';
      if (arcId === 'clout-farmer') return id === 'post-x';
      return false;
    }).length;
    if (count >= arc.triggerCount) newState.activeArcs.add(arcId);
  }

  if (newState.eventTurnsRemaining > 0) {
    newState.eventTurnsRemaining--;
    if (newState.eventTurnsRemaining === 0) newState.activeEvent = null;
  }

  if (!newState.activeEvent && shouldTriggerEvent(newState)) {
    newState.activeEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    newState.eventTurnsRemaining = newState.activeEvent.duration;
  }

  if (newState.tired >= 100) newState.gameOver = true;
  return newState;
}

function shouldTriggerEvent(state: GameState): boolean {
  return state.turn % 3 === 0 && Math.random() < 0.3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getCollapseCause(state: GameState): string {
  const lastAction = state.actionHistory[state.actionHistory.length - 1];
  const causes = lastAction && COLLAPSE_CAUSES[lastAction] ? COLLAPSE_CAUSES[lastAction] : COLLAPSE_CAUSES['default'];
  return causes[Math.floor(Math.random() * causes.length)];
}

export function getEndTitle(state: GameState): string {
  if (state.activeArcs.has('bottom-buyer')) return 'Certified Bottom Buyer';
  if (state.activeArcs.has('doom-scroller')) return 'Doom Scroll Technician';
  if (state.activeArcs.has('clout-farmer')) return 'Professional Hope Holder';
  if (state.activeArcs.has('grass-escape')) return 'Grass-Touching Heretic';
  if (state.activeArcs.has('sleep-gambler')) return 'Sleep Cycle Survivor';
  return END_TITLES[Math.floor(Math.random() * END_TITLES.length)];
}

export function formatShareResult(state: GameState): string {
  const cause = getCollapseCause(state);
  const title = getEndTitle(state);
  return `Too Tired to Win\n\nSurvived: ${state.turn} turns\nCause: ${cause}\nTitle: ${title}\n\n$TOW`;
}