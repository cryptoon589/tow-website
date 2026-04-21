'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

import {
  createInitialState,
  selectRandomActions,
  generateOutcome,
  updateState,
  GameState,
} from '@/components/game/engine';

import { TowCharacter } from '@/components/game/TowCharacter';
import { TiredMeter } from '@/components/game/TiredMeter';
import { OutcomePanel } from '@/components/game/OutcomePanel';
import { ActionButtons } from '@/components/game/ActionButtons';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { SceneLayer } from '@/components/game/SceneLayer';

export default function PlayPage() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [actions, setActions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [preAction, setPreAction] = useState<string | null>(null);

  /* ---------- ACTION ROTATION ---------- */

  useEffect(() => {
    if (!state.gameOver && !isProcessing) {
      setActions(selectRandomActions(state));
    }
  }, [state.turn, state.gameOver, isProcessing]);

  /* ---------- EVENT POPUP ---------- */

  useEffect(() => {
    if (
      state.activeEvent &&
      state.eventTurnsRemaining === state.activeEvent.duration
    ) {
      setShowEvent(true);
      const timer = setTimeout(() => setShowEvent(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.activeEvent, state.eventTurnsRemaining]);

  /* ---------- CLICK HANDLER (KEY UPGRADE) ---------- */

  const handleActionSelect = (actionId: string) => {
    if (isProcessing || state.gameOver) return;

    setIsProcessing(true);
    setPreAction(actionId);

    // anticipation phase
    setTimeout(() => {
      const outcome = generateOutcome(state, actionId);
      const newState = updateState(state, actionId, outcome);

      setState(newState);
      setPreAction(null);

      // small delay before next input
      setTimeout(() => {
        setIsProcessing(false);
      }, 220);
    }, 200); // sweet spot (feels snappy but intentional)
  };

  const handleReplay = () => {
    setState(createInitialState());
    setActions([]);
    setIsProcessing(false);
    setShowEvent(false);
    setPreAction(null);
  };

  /* ---------- MARKET INDICATOR ---------- */

  const getMarketIndicator = () => {
    switch (state.marketState) {
      case 'bull':
        return { icon: '📈', color: 'text-emerald-500', label: 'Bull' };
      case 'bear':
        return { icon: '📉', color: 'text-red-500', label: 'Bear' };
      default:
        return { icon: '🦀', color: 'text-amber-500', label: 'Crab' };
    }
  };

  const market = getMarketIndicator();

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      {/* HEADER */}
      <header className="border-b border-[#DDD7CE] bg-[#FFFCF8]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-[#1E1B18]">
            TOW
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-1 ${market.color}`}>
              <span>{market.icon}</span>
              <span>{market.label}</span>
            </div>

            <div className="text-[#6F685F]">
              Turn {state.turn + 1}
            </div>

            <div className="px-3 py-1 text-xs rounded-full border bg-white">
              Tired {Math.round(state.tired)}%
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Tired Meter */}
          <div className="w-full max-w-xl">
            <TiredMeter tired={state.tired} />
          </div>

          {/* CHARACTER + ENVIRONMENT */}
          <div className="relative w-full flex justify-center mt-6 mb-4 min-h-[260px]">
            <SceneLayer
              marketState={state.marketState}
              tired={state.tired}
              preAction={preAction}
              outcome={state.lastOutcome}
            />

            <div className="relative z-10">
              <TowCharacter
                mood={state.lastOutcome?.mood || 'neutral'}
                vfxType={state.lastOutcome?.vfx || 'none'}
                preAction={preAction}
              />
            </div>
          </div>

          {/* EVENT */}
          <div className="w-full max-w-xl">
            <AnimatePresence>
              {showEvent && state.activeEvent && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#F1EEE8] border rounded-lg px-4 py-3 text-center mb-4"
                >
                  <div className="text-xs italic text-[#6F685F]">
                    Of course.
                  </div>
                  <div className="font-medium text-sm">
                    {state.activeEvent.name}
                  </div>
                  <div className="text-xs text-[#6F685F]">
                    {state.activeEvent.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OUTCOME */}
            <OutcomePanel outcome={state.lastOutcome} />

            {/* ACTIONS */}
            {!state.gameOver && (
              <div className="pt-5">
                <ActionButtons
                  actions={actions}
                  onActionSelect={handleActionSelect}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* EMPTY STATE */}
            {!state.lastOutcome && !state.gameOver && (
              <div className="text-center text-sm text-[#6F685F] pt-5">
                Choose wisely. Or don’t.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* GAME OVER */}
      <AnimatePresence>
        {state.gameOver && (
          <GameOverOverlay state={state} onReplay={handleReplay} />
        )}
      </AnimatePresence>
    </div>
  );
}