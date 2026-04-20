import { motion } from 'framer-motion';
import { GameState } from './engine';
import { getCollapseCause, getEndTitle, formatShareResult } from './engine';

interface GameOverOverlayProps {
  state: GameState;
  onReplay: () => void;
}

export function GameOverOverlay({ state, onReplay }: GameOverOverlayProps) {
  const cause = getCollapseCause(state);
  const title = getEndTitle(state);
  const shareText = formatShareResult(state);

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#0a0a0b]/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', damping: 20 }}
        className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-800 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">Too Tired to Win</h2>
          <div className="text-zinc-500 text-sm">Run Complete</div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-zinc-800/30 rounded-lg p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Turns Survived</div>
            <div className="text-4xl font-bold text-zinc-100">{state.turn}</div>
          </div>

          <div className="bg-zinc-800/30 rounded-lg p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cause of Collapse</div>
            <div className="text-lg font-medium text-red-400">{cause}</div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-indigo-500/30">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Title Earned</div>
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{title}</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onReplay}
            className="w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            Play Again
          </button>

          <button
            onClick={handleCopyShare}
            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-xl transition-colors duration-200 border border-zinc-700"
          >
            Copy Result
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">
          Paste your result anywhere • $TOW
        </div>
      </motion.div>
    </motion.div>
  );
}