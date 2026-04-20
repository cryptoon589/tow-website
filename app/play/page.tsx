'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, createInitialState, selectRandomActions, generateOutcome, updateState } from '@/components/game/engine';
import { TowCharacter } from '@/components/game/TowCharacter';
import { TiredMeter } from '@/components/game/TiredMeter';
import { OutcomePanel } from '@/components/game/OutcomePanel';
import { ActionButtons } from '@/components/game/ActionButtons';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
import { Particles } from '@/components/game/Particles';

export default function PlayPage() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [currentActions, setCurrentActions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEvent, setShowEvent] = useState(false);

  useEffect(() => {
    if (!state.gameOver && !isProcessing) {
      const actions = selectRandomActions(state);
      setCurrentActions(actions);
    }
  }, [state.turn, state.gameOver, isProcessing]);

  useEffect(() => {
    if (state.activeEvent && state.eventTurnsRemaining === state.activeEvent.duration) {
      setShowEvent(true);
      const timer = setTimeout(() => setShowEvent(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.activeEvent, state.eventTurnsRemaining]);

  const handleActionSelect = (actionId: string) => {
    if (isProcessing || state.gameOver) return;
    setIsProcessing(true);
    const outcome = generateOutcome(state, actionId);
    const newState = updateState(state, actionId, outcome);
    setState(newState);
    setTimeout(() => setIsProcessing(false), 800);
  };

  const handleReplay = () => {
    setState(createInitialState());
    setCurrentActions([]);
    setIsProcessing(false);
    setShowEvent(false);
  };

  const getMarketIndicator = () => {
    switch (state.marketState) {
      case 'bull': return { color: 'text-emerald-400', icon: '📈', label: 'Bull' };
      case 'bear': return { color: 'text-red-400', icon: '📉', label: 'Bear' };
      case 'crab': return { color: 'text-amber-400', icon: '🦀', label: 'Crab' };
    }
  };

  const marketInfo = getMarketIndicator();

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <motion.div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
      </div>

      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">TOW</Link>
          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 ${marketInfo.color}`}>
              <span>{marketInfo.icon}</span>
              <span className="font-medium">{marketInfo.label}</span>
            </div>
            <div className="text-zinc-500">Turn {state.turn + 1}</div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              state.tired >= 80 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              state.tired >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              Tired: {Math.round(state.tired)}%
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 md:py-12 relative z-10">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <TiredMeter tired={state.tired} />
          <div className="py-4 relative">
            <TowCharacter mood={state.lastOutcome?.mood || 'neutral'} vfxType={state.lastOutcome?.vfx} />
            <Particles type={
              state.lastOutcome?.vfx === 'zzz' ? 'zzz' :
              state.lastOutcome?.vfx === 'leaf-drift' ? 'leaf' :
              state.lastOutcome?.vfx === 'gold-shine' ? 'sparkle' :
              state.lastOutcome?.vfx === 'dust-puff' ? 'dust' : 'none'
            } />
          </div>
          <AnimatePresence>
            {showEvent && state.activeEvent && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Event Triggered</div>
                <div className="text-sm text-zinc-100">{state.activeEvent.name}</div>
                <div className="text-xs text-zinc-500 mt-1">{state.activeEvent.description}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <OutcomePanel outcome={state.lastOutcome} eventText={showEvent && state.activeEvent ? state.activeEvent.description : undefined} />
          {!state.gameOver && (
            <div className="pt-4">
              <ActionButtons actions={currentActions} onActionSelect={handleActionSelect} disabled={isProcessing} />
            </div>
          )}
          {!state.lastOutcome && !state.gameOver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-center text-sm text-zinc-500 pt-8">
              Choose wisely. Or don't. It doesn't matter.
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {state.gameOver && <GameOverOverlay state={state} onReplay={handleReplay} />}
      </AnimatePresence>
    </div>
  );
}