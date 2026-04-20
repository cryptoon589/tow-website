import { motion, AnimatePresence } from 'framer-motion';
import { OutcomeResult } from './content';

interface OutcomePanelProps {
  outcome: OutcomeResult | null;
  eventText?: string;
}

export function OutcomePanel({ outcome, eventText }: OutcomePanelProps) {
  if (!outcome && !eventText) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      default: return 'text-zinc-100';
    }
  };

  return (
    <AnimatePresence mode="wait">
      {(outcome || eventText) && (
        <motion.div
          key={outcome ? `outcome-${outcome.text}` : `event-${eventText}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-800"
        >
          {eventText && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4 pb-4 border-b border-zinc-800">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Event</div>
              <div className="text-sm text-zinc-100">{eventText}</div>
            </motion.div>
          )}
          
          {outcome && (
            <>
              <div className={`text-lg font-medium mb-2 ${getRarityColor(outcome.rarity)}`}>
                {outcome.text}
              </div>
              
              {outcome.subText && (
                <div className="text-sm text-zinc-500 italic mb-4">
                  {outcome.subText}
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 text-xs">
                {outcome.tiredDelta !== 0 && (
                  <span className={outcome.tiredDelta > 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {outcome.tiredDelta > 0 ? '+' : ''}{outcome.tiredDelta} tired
                  </span>
                )}
                {outcome.sanityDelta !== undefined && outcome.sanityDelta !== 0 && (
                  <span className={outcome.sanityDelta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {outcome.sanityDelta > 0 ? '+' : ''}{outcome.sanityDelta} sanity
                  </span>
                )}
                {outcome.momentumDelta !== undefined && outcome.momentumDelta !== 0 && (
                  <span className={outcome.momentumDelta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {outcome.momentumDelta > 0 ? '↑' : '↓'} momentum
                  </span>
                )}
                {outcome.cloutDelta !== undefined && outcome.cloutDelta !== 0 && (
                  <span className="text-indigo-400">
                    {outcome.cloutDelta > 0 ? '+' : ''}{outcome.cloutDelta} clout
                  </span>
                )}
              </div>
              
              {outcome.rarity !== 'common' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`inline-block mt-3 px-2 py-1 rounded text-xs font-semibold uppercase ${
                    outcome.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                    outcome.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {outcome.rarity}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}