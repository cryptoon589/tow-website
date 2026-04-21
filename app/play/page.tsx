'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GameState,
  createInitialState,
  selectRandomActions,
  generateOutcome,
  updateState
} from '@/components/game/engine';

import TowCharacter from '@/components/game/TowCharacter';
import type { TowState } from '@/lib/towStates';
import { TiredMeter } from '@/components/game/TiredMeter';
import { OutcomePanel } from '@/components/game/OutcomePanel';
import { ActionButtons } from '@/components/game/ActionButtons';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';

function mapOutcomeToTowState(
  mood?: string,
  vfx?: string
): TowState {
  if (vfx === 'glitch') return 'glitch';
  if (mood === 'win' || mood === 'happy' || mood === 'smug') return 'win';
  if (mood === 'lose' || mood === 'sad' || mood === 'regret') return 'lose';
  if (mood === 'rekt') return 'rekt';
  if (mood === 'tired' || mood === 'exhausted') return 'tired';
  return 'idle';
}

export default function PlayPage() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [currentActions, setCurrentActions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [towState, setTowState] = useState<TowState>('idle');

  useEffect(() => {
    if (!state.gameOver && !isProcessing) {
      setCurrentActions(selectRandomActions(state));
    }
  }, [state.turn, state.gameOver, isProcessing]);

  useEffect(() => {
    if (state.activeEvent && state.eventTurnsRemaining === state.activeEvent.duration) {
      setShowEvent(true);
      const timer = setTimeout(() => setShowEvent(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [state.activeEvent, state.eventTurnsRemaining]);

  const handleActionSelect = (actionId: string) => {
    if (isProcessing || state.gameOver) return;

    setIsProcessing(true);
    setTowState('preAction');

    setTimeout(() => {
      setTowState('tap');
    }, 120);

    const outcome = generateOutcome(state, actionId);
    const newState = updateState(state, actionId, outcome);

    setState(newState);

    setTimeout(() => {
      setTowState(mapOutcomeToTowState(outcome?.mood, outcome?.vfx));
    }, 260);

    setTimeout(() => {
      setTowState('idle');
      setIsProcessing(false);
    }, 900);
  };

  const handleReplay = () => {
    setState(createInitialState());
    setCurrentActions([]);
    setIsProcessing(false);
    setShowEvent(false);
    setTowState('idle');
  };

  const getMarketIndicator = () => {
    switch (state.marketState) {
      case 'bull':
        return { color: 'text-emerald-500', icon: '📈', label: 'Bull' };
      case 'bear':
        return { color: 'text-red-500', icon: '📉', label: 'Bear' };
      case 'crab':
        return { color: 'text-amber-500', icon: '🦀', label: 'Crab' };
    }
  };

  const marketInfo = getMarketIndicator();

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">

      <header className="border-b border-[#DDD7CE] bg-[#FFFCF8]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-[#1E1B18] hover:opacity-70 transition"
          >
            TOW
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${marketInfo.color}`}>
              <span>{marketInfo.icon}</span>
              <span className="font-medium">{marketInfo.label}</span>
            </div>

            <div className="text-[#6F685F]">
              Turn {state.turn + 1}
            </div>

            <div className="px-3 py-1 rounded-full text-xs font-semibold border border-[#DDD7CE] bg-white">
              Tired: {Math.round(state.tired)}%
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl space-y-6">

          <TiredMeter tired={state.tired} />

          <div className="flex justify-center py-2 relative">
            <TowCharacter state={towState} />
          </div>

          <AnimatePresence>
            {showEvent && state.activeEvent && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-[#F1EEE8] border border-[#DDD7CE] rounded-lg px-4 py-3 text-center"
              >
                <div className="text-xs text-[#6F685F] mb-1 italic">
                  Of course.
                </div>
                <div className="text-sm text-[#1E1B18] font-medium">
                  {state.activeEvent.name}
                </div>
                <div className="text-xs text-[#6F685F] mt-1">
                  {state.activeEvent.description}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <OutcomePanel
            outcome={state.lastOutcome}
            eventText={
              showEvent && state.activeEvent
                ? state.activeEvent.description
                : undefined
            }
          />

          {!state.gameOver && (
            <div className="pt-2">
              <ActionButtons
                actions={currentActions}
                onActionSelect={handleActionSelect}
                disabled={isProcessing}
              />
            </div>
          )}

          {!state.lastOutcome && !state.gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-[#6F685F] pt-6"
            >
              Choose wisely. Or don’t.
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {state.gameOver && (
          <GameOverOverlay
            state={state}
            onReplay={handleReplay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}