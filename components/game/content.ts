// Content Registry - All text, outcomes, events, titles

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Mood = 'neutral' | 'stressed' | 'hopeful' | 'broken' | 'confused' | 'euphoric' | 'sleepy' | 'regret';
export type MarketState = 'bull' | 'bear' | 'crab';
export type VFXType = 'none' | 'shake' | 'red-flicker' | 'green-pop' | 'gold-shine' | 'dust-puff' | 'zzz' | 'leaf-drift' | 'jitter' | 'spotlight' | 'fake-gain-collapse';

export interface OutcomeResult {
  text: string;
  subText?: string;
  tiredDelta: number;
  sanityDelta?: number;
  momentumDelta?: number;
  cloutDelta?: number;
  luckDelta?: number;
  mood: Mood;
  vfx: VFXType;
  rarity: Rarity;
  eventTriggerChance?: number;
}

export interface ActionDef {
  id: string;
  name: string;
  baseOutcomes: OutcomeResult[];
}

export interface EventDef {
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

export const ACTIONS: ActionDef[] = [
  {
    id: 'check-portfolio',
    name: 'Check Portfolio',
    baseOutcomes: [
      { text: "You check your portfolio.", subText: "It checks you back.", tiredDelta: 8, sanityDelta: -5, momentumDelta: -1, mood: 'stressed', vfx: 'shake', rarity: 'common' },
      { text: "Portfolio opened. Eyes squinted.", tiredDelta: 7, sanityDelta: -3, mood: 'stressed', vfx: 'none', rarity: 'common' },
      { text: "You refresh your portfolio for the 47th time today.", subText: "Nothing changed. You did.", tiredDelta: 9, sanityDelta: -6, momentumDelta: -1, mood: 'regret', vfx: 'red-flicker', rarity: 'rare' },
      { text: "You check your portfolio.", subText: "Bold move.", tiredDelta: 6, sanityDelta: -2, mood: 'neutral', vfx: 'none', rarity: 'common' },
    ],
  },
  {
    id: 'buy-dip',
    name: 'Buy the Dip',
    baseOutcomes: [
      { text: "You buy the dip.", subText: "The dip buys you.", tiredDelta: 12, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: "Buying the dip again.", subText: "This is becoming a pattern.", tiredDelta: 14, sanityDelta: -10, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: "You bought the dip.", subText: "Temporary confidence acquired.", tiredDelta: 10, sanityDelta: -4, momentumDelta: 1, mood: 'hopeful', vfx: 'green-pop', rarity: 'common' },
      { text: "Dip purchased.", subText: "It got worse.", tiredDelta: 13, sanityDelta: -7, momentumDelta: -1, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: "You bought the dip → it almost bounced.", tiredDelta: 15, sanityDelta: -12, momentumDelta: -3, mood: 'broken', vfx: 'red-flicker', rarity: 'epic' },
    ],
  },
  {
    id: 'go-sleep',
    name: 'Go to Sleep',
    baseOutcomes: [
      { text: "You go to sleep.", subText: "Dreams of green candles.", tiredDelta: -15, sanityDelta: 8, momentumDelta: 0, mood: 'sleepy', vfx: 'zzz', rarity: 'common' },
      { text: "Sleep attempted.", subText: "Market doesn't sleep. Neither do you.", tiredDelta: -10, sanityDelta: 3, mood: 'stressed', vfx: 'none', rarity: 'common' },
      { text: "You slept → woke up to generational wealth.", subText: "Not yours.", tiredDelta: -12, sanityDelta: 5, momentumDelta: -1, mood: 'regret', vfx: 'dust-puff', rarity: 'legendary' },
      { text: "Closed your eyes.", subText: "Peace not found.", tiredDelta: -8, sanityDelta: 2, mood: 'neutral', vfx: 'zzz', rarity: 'common' },
    ],
  },
  {
    id: 'touch-grass',
    name: 'Touch Grass',
    baseOutcomes: [
      { text: "You touch grass.", subText: "It touches you back. Awkward.", tiredDelta: -10, sanityDelta: 10, momentumDelta: -1, mood: 'confused', vfx: 'leaf-drift', rarity: 'common' },
      { text: "Grass touched.", subText: "You've learned nothing.", tiredDelta: -8, sanityDelta: 7, mood: 'confused', vfx: 'leaf-drift', rarity: 'common' },
      { text: "You step outside.", subText: "The sun is real. Unsettling.", tiredDelta: -12, sanityDelta: 12, momentumDelta: -2, mood: 'confused', vfx: 'leaf-drift', rarity: 'rare' },
      { text: "Touching grass again.", subText: "This is becoming a habit.", tiredDelta: -6, sanityDelta: 5, mood: 'neutral', vfx: 'none', rarity: 'common' },
    ],
  },
  {
    id: 'open-telegram',
    name: 'Open Telegram',
    baseOutcomes: [
      { text: "You open Telegram.", subText: "Chaos awaits.", tiredDelta: 9, sanityDelta: -6, momentumDelta: -1, mood: 'stressed', vfx: 'jitter', rarity: 'common' },
      { text: "Telegram opened.", subText: "Everyone is coping. You join them.", tiredDelta: 10, sanityDelta: -7, mood: 'stressed', vfx: 'jitter', rarity: 'common' },
      { text: "You check the group chat.", subText: "Still no alpha. Still no hope.", tiredDelta: 11, sanityDelta: -8, momentumDelta: -1, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
    ],
  },
  {
    id: 'post-x',
    name: 'Post on X',
    baseOutcomes: [
      { text: "You post on X.", subText: "Three likes. One is your alt.", tiredDelta: 7, cloutDelta: 2, sanityDelta: -3, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: "Tweet sent: 'WAGMI'", subText: "Nobody believed you. Including you.", tiredDelta: 8, cloutDelta: 3, sanityDelta: -4, mood: 'regret', vfx: 'none', rarity: 'common' },
      { text: "You post a chart.", subText: "It was a screenshot of your losses.", tiredDelta: 9, cloutDelta: 5, sanityDelta: -5, mood: 'broken', vfx: 'shake', rarity: 'rare' },
    ],
  },
  {
    id: 'listen-influencer',
    name: 'Listen to Influencer',
    baseOutcomes: [
      { text: "You listen to an influencer.", subText: "They were wrong. Again.", tiredDelta: 11, sanityDelta: -7, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: "Influencer said 'trust the process.'", subText: "You did. The process betrayed you.", tiredDelta: 13, sanityDelta: -9, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: "You follow their advice.", subText: "Impressive timing. Wrong direction.", tiredDelta: 12, sanityDelta: -8, momentumDelta: -1, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'common' },
    ],
  },
  {
    id: 'sell-peace',
    name: 'Sell for Peace',
    baseOutcomes: [
      { text: "You sell for peace.", subText: "Peace not included.", tiredDelta: 10, sanityDelta: -5, momentumDelta: -2, mood: 'regret', vfx: 'red-flicker', rarity: 'common' },
      { text: "You sold.", subText: "Immediate vertical candle.", tiredDelta: 15, sanityDelta: -12, momentumDelta: -3, mood: 'broken', vfx: 'fake-gain-collapse', rarity: 'legendary' },
      { text: "Sold everything.", subText: "You almost had discipline.", tiredDelta: 8, sanityDelta: -3, momentumDelta: -1, mood: 'neutral', vfx: 'none', rarity: 'common' },
    ],
  },
  {
    id: 'ape-coin',
    name: 'Ape New Coin',
    baseOutcomes: [
      { text: "You ape into a new coin.", subText: "It had no utility. Neither did you.", tiredDelta: 13, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: "New coin acquired.", subText: "Rug pull in 3... 2...", tiredDelta: 14, sanityDelta: -10, momentumDelta: -3, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: "You YOLO into a meme coin.", subText: "For a moment, you felt alive.", tiredDelta: 12, sanityDelta: -6, cloutDelta: 3, momentumDelta: 1, mood: 'euphoric', vfx: 'green-pop', rarity: 'rare' },
      { text: "You ape in.", subText: "It goes to zero. You go to bed.", tiredDelta: 16, sanityDelta: -12, momentumDelta: -3, mood: 'broken', vfx: 'dust-puff', rarity: 'epic' },
    ],
  },
];

export const MARKET_MODIFIERS: Record<MarketState, { tiredMod: number; sanityMod: number; tonePrefixes: string[] }> = {
  bull: { tiredMod: -2, sanityMod: 3, tonePrefixes: ["Green everywhere. Somehow you're still tired.", "Bull market. Bear emotions.", "Everything's up. Except your energy."] },
  bear: { tiredMod: 3, sanityMod: -4, tonePrefixes: ["Bear market. Bear mood.", "Red candles. Red flags.", "Everything bleeds. Including your will to live."] },
  crab: { tiredMod: 1, sanityMod: -2, tonePrefixes: ["Sideways chaos. Maximum confusion.", "Crab market. Pinching your soul.", "Nothing moves. Everything hurts."] },
};

export const BEHAVIOR_ARCS: Record<string, { name: string; triggerCount: number; injectedLines: string[] }> = {
  'bottom-buyer': { name: 'Bottom Buyer', triggerCount: 3, injectedLines: ["you're doing this again", "this is becoming a habit", "you've learned nothing", "again?"] },
  'sleep-gambler': { name: 'Sleep Gambler', triggerCount: 3, injectedLines: ["sleep won't fix this", "you almost had discipline", "rest is just delayed panic"] },
  'grass-escape': { name: 'Grass Escape', triggerCount: 3, injectedLines: ["the grass misses you already", "nature called. You hung up.", "outside is overrated anyway"] },
  'doom-scroller': { name: 'Doom Scroller', triggerCount: 3, injectedLines: ["information is not wisdom", "you know too much. And too little.", "the scroll never ends"] },
  'clout-farmer': { name: 'Clout Farmer', triggerCount: 3, injectedLines: ["posting won't print", "engagement is not equity", "your followers are bots. Your losses are real."] },
};

export const RANDOM_EVENTS: EventDef[] = [
  { id: 'influencer-tweet', name: 'Influencer Tweet', description: 'A crypto influencer tweets something vague and ominous.', duration: 2, effects: { tiredModifier: 2, sanityModifier: -3 }, vfx: 'spotlight' },
  { id: 'dev-goes-silent', name: 'Dev Goes Silent', description: "The project dev hasn't posted in 3 days.", duration: 3, effects: { tiredModifier: 3, sanityModifier: -5, momentumModifier: -2 }, vfx: 'jitter' },
  { id: 'whale-buy', name: 'Whale Buy', description: "Someone just bought $2M worth. Not you.", duration: 2, effects: { tiredModifier: 1, luckModifier: 1, momentumModifier: 1 }, vfx: 'green-pop' },
  { id: 'whale-sell', name: 'Whale Sell', description: "Whale dumps. You feel it in your soul.", duration: 2, effects: { tiredModifier: 4, sanityModifier: -6, momentumModifier: -2 }, vfx: 'red-flicker' },
  { id: 'missed-10x', name: 'Missed 10x', description: "You could have 10x'd. You didn't.", duration: 1, effects: { tiredModifier: 5, sanityModifier: -8 }, vfx: 'shake' },
  { id: 'telegram-chaos', name: 'Telegram Chaos', description: 'The group chat explodes with panic.', duration: 2, effects: { tiredModifier: 3, sanityModifier: -5 }, vfx: 'jitter' },
  { id: 'fake-breakout', name: 'Fake Breakout', description: "Looks like a breakout. It's a breakdown.", duration: 2, effects: { tiredModifier: 4, sanityModifier: -4, momentumModifier: -2 }, vfx: 'fake-gain-collapse' },
  { id: 'soon-announcement', name: '"Soon" Announcement', description: 'Project announces "something big coming soon."', duration: 3, effects: { tiredModifier: 1, sanityModifier: 2, luckModifier: 1 }, vfx: 'spotlight' },
  { id: 'market-freeze', name: 'Market Freeze', description: 'Volume drops to zero. Time stops.', duration: 2, effects: { tiredModifier: 2, momentumModifier: -1 }, vfx: 'dust-puff' },
  { id: 'random-pump', name: 'Random Pump', description: "Something pumps. You don't own it.", duration: 1, effects: { tiredModifier: 3, sanityModifier: -4 }, vfx: 'green-pop' },
];

export const END_TITLES = [
  'Certified Bottom Buyer', 'Exit Liquidity Intern', 'Diamond Hands (Emotionally)', 'Professional Cope Analyst',
  'Grass-Touching Heretic', 'Sleep Cycle Survivor', 'Temporary Genius', 'Market Victim',
  'Permanent Student', '"It\'ll Recover" Specialist', 'Doom Scroll Technician', 'Clarity Avoider',
  'Professional Hope Holder', 'Bag Holder Emeritus', 'Rekt but Reflective', 'Almost Made It',
  'Tired Since Birth', 'Portfolio Philosopher', 'Candle Watcher General', 'FUD Immune System',
  'WAGMI Believer', 'NGMI Realist', 'Paper Hands, Heavy Heart', 'The One Who Held',
  'Liquidity Provider (To Pain)', 'Chart Gazer Supreme', 'Alpha Chaser', 'Beta Tester of Life',
  'Gamma Ray Exposure', 'Delta Neutral (Emotionally Devastated)',
];

export const COLLAPSE_CAUSES: Record<string, string[]> = {
  'check-portfolio': ['Checked portfolio before bed', 'Refreshed one too many times', 'Looked. Regretted. Repeated.'],
  'buy-dip': ['Bought the dip (again)', 'Caught the falling knife', 'Dip buyer until the end'],
  'go-sleep': ['Slept through the pump', 'Dreamed of green. Woke to red.', 'Rest was weakness'],
  'touch-grass': ['Touched grass. Lost focus.', 'Nature was a distraction', 'Outside world was too real'],
  'open-telegram': ['Opened Telegram', 'Read the cope. Became the cope.', 'Group chat broke you'],
  'post-x': ['Posted instead of profited', 'Tweeted your way to zero', 'Clout over coins'],
  'listen-influencer': ['Trusted the influencer', 'Followed the wrong guru', 'Listened. Lost.'],
  'sell-peace': ['Sold for peace', 'Exited at the bottom', 'Peace not found'],
  'ape-coin': ['Aped into oblivion', 'New coin, same pain', 'YOLO\'d into nothing'],
  'default': ['Too tired to win', 'Burned out beautifully', 'Exhausted by excellence', 'Fatigue was inevitable'],
};

export const TONE_VARIANTS = {
  dry: ['', 'simply put: ', 'fact: ', 'observation: '],
  sarcastic: ['wow. ', 'impressive. ', 'groundbreaking. ', 'never seen this before. '],
  brutal: ['it got worse. ', 'somehow, worse. ', 'of course. ', 'naturally. '],
  philosophical: ['in the end, ', 'such is life. ', 'the market teaches. ', 'existence is fatigue. '],
  absurd: ['meanwhile, in another dimension, ', 'plot twist: ', 'reality glitched. ', 'the simulation flickers. '],
};

export const TWIST_LINES = ['near miss', 'almost worked', 'wrong timing', 'right idea, wrong universe', 'cosmic joke', 'temporary setback', 'permanent lesson', 'you knew better', 'hope is not a strategy', 'discipline was optional'];

export const RARITY_WEIGHTS = { common: 70, rare: 20, epic: 8, legendary: 2 };