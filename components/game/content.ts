// Content Registry - Expanded, higher-variety, punchier writing

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Mood =
  | 'neutral'
  | 'stressed'
  | 'hopeful'
  | 'broken'
  | 'confused'
  | 'euphoric'
  | 'sleepy'
  | 'regret';
export type MarketState = 'bull' | 'bear' | 'crab';
export type VFXType =
  | 'none'
  | 'shake'
  | 'red-flicker'
  | 'green-pop'
  | 'gold-shine'
  | 'dust-puff'
  | 'zzz'
  | 'leaf-drift'
  | 'jitter'
  | 'spotlight'
  | 'fake-gain-collapse';

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
      { text: 'You checked.', subText: 'That was a mistake.', tiredDelta: 10, sanityDelta: -6, momentumDelta: -1, mood: 'stressed', vfx: 'shake', rarity: 'common' },
      { text: 'You checked again.', subText: 'Nothing improved.', tiredDelta: 9, sanityDelta: -5, momentumDelta: -1, mood: 'stressed', vfx: 'none', rarity: 'common' },
      { text: 'Portfolio opened.', subText: 'Immediate regret.', tiredDelta: 8, sanityDelta: -4, mood: 'regret', vfx: 'red-flicker', rarity: 'common' },
      { text: 'You refreshed.', subText: 'Bold move.', tiredDelta: 7, sanityDelta: -3, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You checked the chart.', subText: 'It checked you back.', tiredDelta: 9, sanityDelta: -5, momentumDelta: -1, mood: 'stressed', vfx: 'shake', rarity: 'common' },
      { text: 'You looked.', subText: 'It got worse.', tiredDelta: 11, sanityDelta: -7, momentumDelta: -1, mood: 'regret', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You refreshed one more time.', subText: 'You knew this would happen.', tiredDelta: 10, sanityDelta: -6, momentumDelta: -1, mood: 'regret', vfx: 'none', rarity: 'rare' },
      { text: 'You checked.', subText: 'Temporary confidence achieved.', tiredDelta: 6, sanityDelta: 1, momentumDelta: 1, mood: 'hopeful', vfx: 'green-pop', rarity: 'rare' },
      { text: 'You checked your bags.', subText: 'They checked your soul.', tiredDelta: 11, sanityDelta: -8, momentumDelta: -1, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You opened the portfolio.', subText: 'Still not a personality.', tiredDelta: 8, sanityDelta: -4, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You checked.', subText: 'You were early. Just not correct.', tiredDelta: 12, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'epic' },
      { text: 'You checked before bed.', subText: 'Now nobody sleeps.', tiredDelta: 13, sanityDelta: -9, momentumDelta: -1, mood: 'broken', vfx: 'red-flicker', rarity: 'epic' },
    ],
  },
  {
    id: 'buy-dip',
    name: 'Buy the Dip',
    baseOutcomes: [
      { text: 'You bought the dip.', subText: 'It dipped again.', tiredDelta: 13, sanityDelta: -7, momentumDelta: -2, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'common' },
      { text: 'You bought again.', subText: 'This is becoming a pattern.', tiredDelta: 14, sanityDelta: -8, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You stepped in early.', subText: 'Too early.', tiredDelta: 12, sanityDelta: -6, momentumDelta: -1, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: 'You added to the position.', subText: 'This felt right at the time.', tiredDelta: 11, sanityDelta: -5, momentumDelta: -1, mood: 'hopeful', vfx: 'green-pop', rarity: 'common' },
      { text: 'You bought the dip.', subText: 'Temporary confidence acquired.', tiredDelta: 10, sanityDelta: -3, momentumDelta: 1, mood: 'hopeful', vfx: 'green-pop', rarity: 'common' },
      { text: 'You doubled down.', subText: 'The market doubled back.', tiredDelta: 14, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You bought.', subText: 'It found a lower floor.', tiredDelta: 15, sanityDelta: -9, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You pressed buy.', subText: 'You almost timed it.', tiredDelta: 10, sanityDelta: -3, momentumDelta: 1, mood: 'hopeful', vfx: 'green-pop', rarity: 'rare' },
      { text: 'You bought the dip.', subText: 'It bounced… briefly.', tiredDelta: 12, sanityDelta: -5, momentumDelta: 0, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You bought.', subText: 'This almost worked.', tiredDelta: 11, sanityDelta: -4, momentumDelta: 0, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You bought harder.', subText: 'You are part of the liquidity now.', tiredDelta: 15, sanityDelta: -10, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'epic' },
      { text: 'You caught the dip.', subText: 'It was not the bottom.', tiredDelta: 14, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: 'You bought with conviction.', subText: 'The chart did not reciprocate.', tiredDelta: 13, sanityDelta: -7, momentumDelta: -1, mood: 'regret', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You bought the dip.', subText: 'For a moment, you looked smart.', tiredDelta: 9, sanityDelta: 1, momentumDelta: 2, mood: 'hopeful', vfx: 'green-pop', rarity: 'epic' },
      { text: 'You bought.', subText: 'This one actually worked.', tiredDelta: 6, sanityDelta: 4, momentumDelta: 3, mood: 'euphoric', vfx: 'gold-shine', rarity: 'legendary', eventTriggerChance: 0.2 },
    ],
  },
  {
    id: 'go-sleep',
    name: 'Go to Sleep',
    baseOutcomes: [
      { text: 'You went to sleep.', subText: 'The market moved.', tiredDelta: -12, sanityDelta: 5, momentumDelta: 0, mood: 'sleepy', vfx: 'zzz', rarity: 'common' },
      { text: 'You slept.', subText: 'You missed everything.', tiredDelta: -11, sanityDelta: -2, momentumDelta: -1, mood: 'sleepy', vfx: 'zzz', rarity: 'common' },
      { text: 'Sleep attempted.', subText: 'Peace was temporary.', tiredDelta: -9, sanityDelta: 3, mood: 'sleepy', vfx: 'zzz', rarity: 'common' },
      { text: 'You closed your eyes.', subText: 'The market did not.', tiredDelta: -10, sanityDelta: 2, mood: 'stressed', vfx: 'none', rarity: 'common' },
      { text: 'You slept.', subText: 'You were right… but asleep.', tiredDelta: -10, sanityDelta: -4, momentumDelta: -1, mood: 'regret', vfx: 'dust-puff', rarity: 'rare' },
      { text: 'You slept through it.', subText: 'Probably for the best.', tiredDelta: -13, sanityDelta: 6, mood: 'sleepy', vfx: 'zzz', rarity: 'rare' },
      { text: 'You tried to rest.', subText: 'The chart came with you.', tiredDelta: -8, sanityDelta: -1, mood: 'stressed', vfx: 'none', rarity: 'common' },
      { text: 'You slept.', subText: 'It pumped without you.', tiredDelta: -9, sanityDelta: -6, momentumDelta: -2, mood: 'regret', vfx: 'dust-puff', rarity: 'rare' },
      { text: 'You got some sleep.', subText: 'Your portfolio did not.', tiredDelta: -11, sanityDelta: 4, mood: 'sleepy', vfx: 'zzz', rarity: 'common' },
      { text: 'You slept.', subText: 'Clarity not included.', tiredDelta: -10, sanityDelta: 2, mood: 'neutral', vfx: 'zzz', rarity: 'common' },
      { text: 'You slept.', subText: 'Generational wealth happened. Not yours.', tiredDelta: -12, sanityDelta: -3, momentumDelta: -1, mood: 'regret', vfx: 'dust-puff', rarity: 'legendary' },
      { text: 'You went to bed.', subText: 'Best decision so far.', tiredDelta: -14, sanityDelta: 8, momentumDelta: 1, mood: 'sleepy', vfx: 'gold-shine', rarity: 'epic' },
    ],
  },
  {
    id: 'touch-grass',
    name: 'Touch Grass',
    baseOutcomes: [
      { text: 'You touched grass.', subText: 'Confusing experience.', tiredDelta: -8, sanityDelta: 7, momentumDelta: 0, mood: 'confused', vfx: 'leaf-drift', rarity: 'common' },
      { text: 'You went outside.', subText: 'Nobody noticed.', tiredDelta: -7, sanityDelta: 6, momentumDelta: 0, mood: 'neutral', vfx: 'leaf-drift', rarity: 'common' },
      { text: 'You stepped outside.', subText: 'The sun is real. Unsettling.', tiredDelta: -10, sanityDelta: 9, momentumDelta: -1, mood: 'confused', vfx: 'leaf-drift', rarity: 'rare' },
      { text: 'Grass touched.', subText: 'You still learned nothing.', tiredDelta: -7, sanityDelta: 5, mood: 'confused', vfx: 'leaf-drift', rarity: 'common' },
      { text: 'You went outside.', subText: 'The market pumped.', tiredDelta: -6, sanityDelta: -4, momentumDelta: -1, mood: 'regret', vfx: 'leaf-drift', rarity: 'rare' },
      { text: 'You touched grass.', subText: 'You feel… slightly better.', tiredDelta: -9, sanityDelta: 8, mood: 'neutral', vfx: 'leaf-drift', rarity: 'common' },
      { text: 'You looked at a tree.', subText: 'It had stronger fundamentals.', tiredDelta: -8, sanityDelta: 6, mood: 'confused', vfx: 'leaf-drift', rarity: 'rare' },
      { text: 'You got fresh air.', subText: 'The chart did not come with you.', tiredDelta: -10, sanityDelta: 8, mood: 'hopeful', vfx: 'leaf-drift', rarity: 'rare' },
      { text: 'You touched grass again.', subText: 'This is becoming healthy.', tiredDelta: -7, sanityDelta: 7, momentumDelta: 1, mood: 'neutral', vfx: 'leaf-drift', rarity: 'rare' },
      { text: 'You went outside.', subText: 'You might be healing.', tiredDelta: -11, sanityDelta: 10, momentumDelta: 1, mood: 'hopeful', vfx: 'gold-shine', rarity: 'epic' },
      { text: 'You touched grass.', subText: 'You moved on. Briefly.', tiredDelta: -12, sanityDelta: 11, momentumDelta: 1, mood: 'neutral', vfx: 'gold-shine', rarity: 'legendary' },
    ],
  },
  {
    id: 'open-telegram',
    name: 'Open Telegram',
    baseOutcomes: [
      { text: 'You opened Telegram.', subText: 'Chaos awaits.', tiredDelta: 9, sanityDelta: -6, momentumDelta: -1, mood: 'stressed', vfx: 'jitter', rarity: 'common' },
      { text: 'Telegram opened.', subText: 'Nobody knows anything.', tiredDelta: 8, sanityDelta: -5, mood: 'stressed', vfx: 'jitter', rarity: 'common' },
      { text: 'You checked the group chat.', subText: 'Still no alpha.', tiredDelta: 9, sanityDelta: -6, mood: 'neutral', vfx: 'jitter', rarity: 'common' },
      { text: 'Telegram opened.', subText: 'Everyone is coping. You join them.', tiredDelta: 10, sanityDelta: -7, mood: 'stressed', vfx: 'jitter', rarity: 'common' },
      { text: 'You opened Telegram.', subText: '143 messages. Zero clarity.', tiredDelta: 11, sanityDelta: -8, momentumDelta: -1, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'The group chat loaded.', subText: 'Your peace did not.', tiredDelta: 10, sanityDelta: -7, mood: 'regret', vfx: 'jitter', rarity: 'rare' },
      { text: 'You opened Telegram.', subText: 'The cope is industrial-grade today.', tiredDelta: 10, sanityDelta: -6, mood: 'stressed', vfx: 'jitter', rarity: 'rare' },
      { text: 'You checked the chat.', subText: 'Someone said “easy hold.”', tiredDelta: 12, sanityDelta: -8, momentumDelta: -1, mood: 'regret', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'Telegram opened.', subText: 'The scroll never ends.', tiredDelta: 9, sanityDelta: -5, mood: 'broken', vfx: 'jitter', rarity: 'common' },
      { text: 'You entered the group.', subText: 'It smelled like panic.', tiredDelta: 11, sanityDelta: -8, mood: 'broken', vfx: 'shake', rarity: 'epic' },
      { text: 'You opened Telegram.', subText: 'You became the cope.', tiredDelta: 12, sanityDelta: -9, momentumDelta: -1, mood: 'broken', vfx: 'red-flicker', rarity: 'epic' },
    ],
  },
  {
    id: 'post-x',
    name: 'Post on X',
    baseOutcomes: [
      { text: 'You posted on X.', subText: 'Three likes. One is your alt.', tiredDelta: 7, cloutDelta: 2, sanityDelta: -3, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You posted.', subText: 'Engagement is not equity.', tiredDelta: 8, cloutDelta: 3, sanityDelta: -4, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You tweeted “WAGMI.”', subText: 'Nobody believed you. Including you.', tiredDelta: 9, cloutDelta: 3, sanityDelta: -4, mood: 'regret', vfx: 'none', rarity: 'common' },
      { text: 'You posted a chart.', subText: 'It was mostly pain.', tiredDelta: 8, cloutDelta: 4, sanityDelta: -4, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You posted the setup.', subText: 'Wrong direction.', tiredDelta: 9, cloutDelta: 4, sanityDelta: -5, mood: 'regret', vfx: 'shake', rarity: 'rare' },
      { text: 'You posted your conviction.', subText: 'The market did not engage.', tiredDelta: 8, cloutDelta: 3, sanityDelta: -4, mood: 'regret', vfx: 'none', rarity: 'rare' },
      { text: 'You posted for the timeline.', subText: 'You should have posted less and slept more.', tiredDelta: 10, cloutDelta: 5, sanityDelta: -6, mood: 'regret', vfx: 'none', rarity: 'rare' },
      { text: 'You posted a bullish thread.', subText: 'The chart was not a subscriber.', tiredDelta: 9, cloutDelta: 6, sanityDelta: -5, mood: 'regret', vfx: 'shake', rarity: 'rare' },
      { text: 'You posted the pain.', subText: 'Now it’s content.', tiredDelta: 8, cloutDelta: 6, sanityDelta: -4, mood: 'broken', vfx: 'none', rarity: 'epic' },
      { text: 'You posted instead of profiting.', subText: 'At least somebody saw it.', tiredDelta: 9, cloutDelta: 7, sanityDelta: -5, mood: 'neutral', vfx: 'spotlight', rarity: 'epic' },
      { text: 'You posted.', subText: 'This one actually hit.', tiredDelta: 5, cloutDelta: 10, sanityDelta: 2, mood: 'euphoric', vfx: 'gold-shine', rarity: 'legendary', eventTriggerChance: 0.15 },
    ],
  },
  {
    id: 'listen-influencer',
    name: 'Listen to Influencer',
    baseOutcomes: [
      { text: 'You listened to an influencer.', subText: 'They were wrong. Again.', tiredDelta: 11, sanityDelta: -7, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: 'You followed the call.', subText: 'Impressive timing. Wrong direction.', tiredDelta: 12, sanityDelta: -8, momentumDelta: -1, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'common' },
      { text: 'Influencer said “trust the process.”', subText: 'The process betrayed you.', tiredDelta: 13, sanityDelta: -9, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You listened carefully.', subText: 'That was the problem.', tiredDelta: 11, sanityDelta: -6, mood: 'neutral', vfx: 'shake', rarity: 'common' },
      { text: 'You followed the guru.', subText: 'The guru floated. You sank.', tiredDelta: 13, sanityDelta: -9, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You took their advice.', subText: 'This felt expensive.', tiredDelta: 12, sanityDelta: -7, momentumDelta: -1, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You listened to the space.', subText: 'It sounded confident.', tiredDelta: 10, sanityDelta: -5, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You trusted the thread.', subText: 'You should not have.', tiredDelta: 12, sanityDelta: -8, mood: 'regret', vfx: 'shake', rarity: 'rare' },
      { text: 'You copied the move.', subText: 'You got the timing. Not the exit.', tiredDelta: 12, sanityDelta: -7, momentumDelta: -1, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'epic' },
      { text: 'You listened to an influencer.', subText: 'Somehow, this one was right.', tiredDelta: 7, sanityDelta: 2, momentumDelta: 2, mood: 'hopeful', vfx: 'green-pop', rarity: 'epic' },
    ],
  },
  {
    id: 'sell-peace',
    name: 'Sell for Peace',
    baseOutcomes: [
      { text: 'You sold for peace.', subText: 'Peace not included.', tiredDelta: 10, sanityDelta: -5, momentumDelta: -2, mood: 'regret', vfx: 'red-flicker', rarity: 'common' },
      { text: 'You sold.', subText: 'Immediate vertical candle.', tiredDelta: 15, sanityDelta: -12, momentumDelta: -3, mood: 'broken', vfx: 'fake-gain-collapse', rarity: 'legendary' },
      { text: 'You sold the position.', subText: 'You almost had discipline.', tiredDelta: 8, sanityDelta: -3, momentumDelta: -1, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You exited cleanly.', subText: 'Emotionally, no.', tiredDelta: 9, sanityDelta: -4, momentumDelta: -1, mood: 'regret', vfx: 'none', rarity: 'common' },
      { text: 'You sold for clarity.', subText: 'Clarity was delayed.', tiredDelta: 8, sanityDelta: -2, momentumDelta: -1, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You sold the bounce.', subText: 'It kept going.', tiredDelta: 13, sanityDelta: -9, momentumDelta: -2, mood: 'broken', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You got out.', subText: 'The chart took that personally.', tiredDelta: 12, sanityDelta: -7, momentumDelta: -2, mood: 'regret', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You sold.', subText: 'You knew what would happen next.', tiredDelta: 12, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You sold for peace.', subText: 'The market offered irony instead.', tiredDelta: 11, sanityDelta: -7, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'epic' },
      { text: 'You sold.', subText: 'For one second, it looked genius.', tiredDelta: 7, sanityDelta: 1, momentumDelta: 1, mood: 'hopeful', vfx: 'green-pop', rarity: 'epic' },
    ],
  },
  {
    id: 'ape-coin',
    name: 'Ape New Coin',
    baseOutcomes: [
      { text: 'You aped into a new coin.', subText: 'Wrong ecosystem. Same pain.', tiredDelta: 13, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: 'You aped in.', subText: 'It had no utility. Neither did this decision.', tiredDelta: 14, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: 'New coin acquired.', subText: 'Rug pull in 3… 2…', tiredDelta: 14, sanityDelta: -10, momentumDelta: -3, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You YOLO’d a meme coin.', subText: 'For a moment, you felt alive.', tiredDelta: 12, sanityDelta: -5, cloutDelta: 3, momentumDelta: 1, mood: 'euphoric', vfx: 'green-pop', rarity: 'rare' },
      { text: 'You bought the new thing.', subText: 'This was definitely a choice.', tiredDelta: 12, sanityDelta: -6, momentumDelta: -1, mood: 'neutral', vfx: 'none', rarity: 'common' },
      { text: 'You aped into the narrative.', subText: 'The narrative left early.', tiredDelta: 13, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You aped the runner.', subText: 'You were not first.', tiredDelta: 13, sanityDelta: -7, momentumDelta: -2, mood: 'regret', vfx: 'fake-gain-collapse', rarity: 'rare' },
      { text: 'You entered at speed.', subText: 'Exit liquidity welcomes you.', tiredDelta: 15, sanityDelta: -10, momentumDelta: -2, mood: 'broken', vfx: 'red-flicker', rarity: 'rare' },
      { text: 'You bought the hot coin.', subText: 'It cooled instantly.', tiredDelta: 13, sanityDelta: -8, momentumDelta: -2, mood: 'regret', vfx: 'shake', rarity: 'common' },
      { text: 'You aped in.', subText: 'This almost looked smart.', tiredDelta: 11, sanityDelta: -3, momentumDelta: 1, mood: 'hopeful', vfx: 'green-pop', rarity: 'epic' },
      { text: 'You aped in.', subText: 'It goes to zero. You go to bed.', tiredDelta: 16, sanityDelta: -12, momentumDelta: -3, mood: 'broken', vfx: 'dust-puff', rarity: 'epic' },
      { text: 'You bought the random coin.', subText: 'Somehow, it actually ran.', tiredDelta: 7, sanityDelta: 3, momentumDelta: 3, mood: 'euphoric', vfx: 'gold-shine', rarity: 'legendary', eventTriggerChance: 0.2 },
    ],
  },
];

export const MARKET_MODIFIERS: Record<
  MarketState,
  { tiredMod: number; sanityMod: number; tonePrefixes: string[] }
> = {
  bull: {
    tiredMod: -2,
    sanityMod: 3,
    tonePrefixes: [
      "Green everywhere. You're still exhausted.",
      'Bull market. Bear emotions.',
      "Everything's up. Except your energy.",
      'Even in green, you found a way to suffer.',
      'The chart is alive. You are barely managing.',
      'Things are working. You still look worried.',
    ],
  },
  bear: {
    tiredMod: 3,
    sanityMod: -4,
    tonePrefixes: [
      'Bear market. Bear mood.',
      'Red candles. Red flags.',
      'Everything bleeds. Including your will to live.',
      'Pain remains the strongest narrative.',
      'The market is correcting. Your soul is included.',
      'Nothing here feels healthy.',
    ],
  },
  crab: {
    tiredMod: 1,
    sanityMod: -2,
    tonePrefixes: [
      'Sideways chaos. Maximum confusion.',
      'Crab market. Pinching your soul.',
      'Nothing moves. Everything hurts.',
      'No breakout. Just vibes and fatigue.',
      'Flat chart. Uneven emotions.',
      'You are range-bound spiritually.',
    ],
  },
};

export const BEHAVIOR_ARCS: Record<
  string,
  { name: string; triggerCount: number; injectedLines: string[] }
> = {
  'bottom-buyer': {
    name: 'Bottom Buyer',
    triggerCount: 3,
    injectedLines: [
      "you're doing this again",
      'this is becoming a habit',
      "you've learned nothing",
      'again?',
      'discipline was available',
      'you almost resisted',
      'same move, worse candle',
      'this keeps feeling personal',
    ],
  },
  'sleep-gambler': {
    name: 'Sleep Gambler',
    triggerCount: 3,
    injectedLines: [
      "sleep won't fix this",
      'rest is just delayed panic',
      'you were right, just unconscious',
      'you keep outsourcing decisions to bedtime',
      'you almost woke up rich',
      'dreams continue to outperform strategy',
    ],
  },
  'grass-escape': {
    name: 'Grass Escape',
    triggerCount: 3,
    injectedLines: [
      'the grass misses you already',
      'nature called. you hung up.',
      'outside is strangely stable',
      'you are becoming difficult to manipulate',
      'this is suspiciously healthy',
      'fresh air is not a trading strategy',
    ],
  },
  'doom-scroller': {
    name: 'Doom Scroller',
    triggerCount: 3,
    injectedLines: [
      'information is not wisdom',
      'you know too much. and too little.',
      'the scroll never ends',
      'none of this helped',
      'you are gathering stress, not alpha',
      'more updates, less peace',
      'knowledge has not improved your timing',
    ],
  },
  'clout-farmer': {
    name: 'Clout Farmer',
    triggerCount: 3,
    injectedLines: [
      "posting won't print",
      'engagement is not equity',
      'your followers are bots. your losses are real.',
      'attention remains unmonetized',
      'the timeline cannot save you',
      'you chose visibility over stability',
      'content was made. profit was not.',
    ],
  },
};

export const RANDOM_EVENTS: EventDef[] = [
  {
    id: 'influencer-tweet',
    name: 'An influencer tweets something vague.',
    description: 'Nobody knows what it means. Everyone reacts anyway.',
    duration: 2,
    effects: { tiredModifier: 2, sanityModifier: -3 },
    vfx: 'spotlight',
  },
  {
    id: 'dev-goes-silent',
    name: 'The dev goes quiet.',
    description: "No update. No reassurance. Just vibes.",
    duration: 3,
    effects: { tiredModifier: 3, sanityModifier: -5, momentumModifier: -2 },
    vfx: 'jitter',
  },
  {
    id: 'whale-buy',
    name: 'A whale appears.',
    description: 'Big buy. Bigger emotions.',
    duration: 2,
    effects: { tiredModifier: 1, luckModifier: 1, momentumModifier: 1 },
    vfx: 'green-pop',
  },
  {
    id: 'whale-sell',
    name: 'A whale exits.',
    description: 'The chart feels lighter. You do not.',
    duration: 2,
    effects: { tiredModifier: 4, sanityModifier: -6, momentumModifier: -2 },
    vfx: 'red-flicker',
  },
  {
    id: 'missed-10x',
    name: 'You notice a chart you ignored.',
    description: 'It did a 10x. Excellent timing, just not yours.',
    duration: 1,
    effects: { tiredModifier: 5, sanityModifier: -8 },
    vfx: 'shake',
  },
  {
    id: 'telegram-chaos',
    name: 'Telegram loses its mind.',
    description: 'Confidence has left the group chat.',
    duration: 2,
    effects: { tiredModifier: 3, sanityModifier: -5 },
    vfx: 'jitter',
  },
  {
    id: 'fake-breakout',
    name: 'The chart teases freedom.',
    description: 'It was not freedom.',
    duration: 2,
    effects: { tiredModifier: 4, sanityModifier: -4, momentumModifier: -2 },
    vfx: 'fake-gain-collapse',
  },
  {
    id: 'soon-announcement',
    name: 'Something is “coming soon.”',
    description: 'A familiar sentence returns.',
    duration: 3,
    effects: { tiredModifier: 1, sanityModifier: 2, luckModifier: 1 },
    vfx: 'spotlight',
  },
  {
    id: 'market-freeze',
    name: 'The market goes still.',
    description: 'Nothing moves. Your stress remains liquid.',
    duration: 2,
    effects: { tiredModifier: 2, momentumModifier: -1 },
    vfx: 'dust-puff',
  },
  {
    id: 'random-pump',
    name: 'Something random starts flying.',
    description: "You don't own it. Naturally.",
    duration: 1,
    effects: { tiredModifier: 3, sanityModifier: -4 },
    vfx: 'green-pop',
  },
];

export const END_TITLES = [
  'Certified Bottom Buyer',
  'Exit Liquidity Intern',
  'Diamond Hands (Emotionally)',
  'Professional Cope Analyst',
  'Grass-Touching Heretic',
  'Sleep Cycle Survivor',
  'Temporary Genius',
  'Market Victim',
  'Permanent Student',
  `"It'll Recover" Specialist`,
  'Doom Scroll Technician',
  'Clarity Avoider',
  'Professional Hope Holder',
  'Bag Holder Emeritus',
  'Rekt but Reflective',
  'Almost Made It',
  'Tired Since Birth',
  'Portfolio Philosopher',
  'Candle Watcher General',
  'FUD Immune System',
  'WAGMI Believer',
  'NGMI Realist',
  'Paper Hands, Heavy Heart',
  'The One Who Held',
  'Liquidity Provider (To Pain)',
  'Chart Gazer Supreme',
  'Alpha Chaser',
  'Beta Tester of Life',
  'Gamma Ray Exposure',
  'Delta Neutral (Emotionally Devastated)',
  'Bottom Caller, Top Exit',
  'Signal Collector',
  'Narrative Casualty',
  'Certified Near-Miss',
  'Exit Timing Hobbyist',
  'Thread Reader, Profit Avoider',
  'Macro Understander, Micro Loser',
  'Generational Bag Carrier',
  'Hope-Funded Trader',
  'Sleep-Deprived Visionary',
  'Technically Still Here',
  'Emotionally Margin Called',
];

export const COLLAPSE_CAUSES: Record<string, string[]> = {
  'check-portfolio': [
    'Checked portfolio before bed',
    'Refreshed one too many times',
    'Looked. Regretted. Repeated.',
    'Saw the chart and stayed anyway',
    'Opened the app against better judgment',
  ],
  'buy-dip': [
    'Bought the dip (again)',
    'Caught the falling knife',
    'Dip buyer until the end',
    'Believed in one more entry',
    'Mistook motion for opportunity',
  ],
  'go-sleep': [
    'Slept through the pump',
    'Dreamed of green. Woke to red.',
    'Rest was weakness',
    'Delegated decisions to sleep',
    'Missed everything professionally',
  ],
  'touch-grass': [
    'Touched grass. Lost focus.',
    'Nature was a distraction',
    'Outside world was too real',
    'Went outside at the wrong time',
    'Chose balance over monitoring',
  ],
  'open-telegram': [
    'Opened Telegram',
    'Read the cope. Became the cope.',
    'Group chat broke you',
    'Scrolled until stability left',
    'Absorbed too much community sentiment',
  ],
  'post-x': [
    'Posted instead of profiting',
    'Tweeted your way to zero',
    'Clout over coins',
    'Chased engagement, not exits',
    'Turned pain into content',
  ],
  'listen-influencer': [
    'Trusted the influencer',
    'Followed the wrong guru',
    'Listened. Lost.',
    'Outsourced conviction',
    'Believed the thread',
  ],
  'sell-peace': [
    'Sold for peace',
    'Exited at the bottom',
    'Peace not found',
    'Closed the trade. Opened regret.',
    'Secured calm. Missed the candle.',
  ],
  'ape-coin': [
    'Aped into oblivion',
    'New coin, same pain',
    "YOLO'd into nothing",
    'Bought the narrative at the end',
    'Became liquidity on purpose',
  ],
  default: [
    'Too tired to win',
    'Burned out beautifully',
    'Exhausted by excellence',
    'Fatigue was inevitable',
    'Emotionally overexposed',
  ],
};

export const TONE_VARIANTS = {
  dry: ['', 'fact: ', 'observation: ', 'simply put: ', 'result: '],
  sarcastic: ['wow. ', 'impressive. ', 'groundbreaking. ', 'never seen this before. ', 'excellent work. '],
  brutal: ['it got worse. ', 'naturally. ', 'of course. ', 'somehow, worse. ', 'bad call. '],
  philosophical: ['in the end, ', 'such is life. ', 'the market teaches. ', 'existence remains exhausting. ', 'all candles return to pain. '],
  absurd: ['plot twist: ', 'meanwhile, in another timeline, ', 'the simulation flickers. ', 'reality glitched. ', 'somehow this is canon. '],
};

export const TWIST_LINES = [
  'near miss',
  'almost worked',
  'wrong timing',
  'right idea, wrong universe',
  'cosmic joke',
  'temporary setback',
  'permanent lesson',
  'you knew better',
  'hope is not a strategy',
  'discipline was optional',
  'looked good for a second',
  'conviction exceeded evidence',
  'you almost learned something',
  'temporary confidence achieved',
  'the setup was clean, the result was not',
  'you were early. just not correct.',
  'this felt right at the time',
  'you are part of the liquidity',
  'the dip had a basement',
  'the bounce was decorative',
];

export const RARITY_WEIGHTS = {
  common: 70,
  rare: 20,
  epic: 8,
  legendary: 2,
};