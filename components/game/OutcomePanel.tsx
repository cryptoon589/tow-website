import { motion, AnimatePresence } from 'framer-motion';
import { GameOutcome } from './engine';

interface OutcomePanelProps {
  outcome?: GameOutcome | null;
  eventText?: string;
}

export function OutcomePanel({ outcome, eventText }: OutcomePanelProps) {
  return (
    <div className="min-h-[110px]">
      <AnimatePresence mode="wait">
        {outcome ? (
          <motion.div
            key={outcome.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-[#FFFCF8] border border-[#DDD7CE] rounded-xl px-5 py-4 shadow-sm"
          >
            {eventText && (
              <div className="text-xs text-[#6F685F] mb-2 italic">
                {eventText}
              </div>
            )}

            <div className="text-[17px] font-semibold text-[#1E1B18] leading-snug">
              {outcome.mainText}
            </div>

            {outcome.subText && (
              <div className="text-sm text-[#6F685F] mt-1 italic">
                {outcome.subText}
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs mt-3 text-[#6F685F]">
              {outcome.effects.tired !== 0 && (
                <span className="text-[#E56B6F]">
                  {formatValue(outcome.effects.tired)} tired
                </span>
              )}
              {outcome.effects.sanity !== 0 && (
                <span>
                  {formatValue(outcome.effects.sanity)} sanity
                </span>
              )}
              {outcome.effects.momentum !== 0 && (
                <span>
                  {formatMomentum(outcome.effects.momentum)} momentum
                </span>
              )}
            </div>

            {outcome.rarity !== 'common' && (
              <div className="mt-2 text-right text-[10px] font-semibold tracking-wide uppercase text-[#948B81]">
                {outcome.rarity}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-[#6F685F]"
          >
            Choose wisely. Or don’t.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatMomentum(value: number) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `↓ ${Math.abs(value)}`;
  return '0';
}