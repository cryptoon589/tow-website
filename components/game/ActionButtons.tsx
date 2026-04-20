import { motion } from 'framer-motion';

interface ActionButtonsProps {
  actions: string[];
  onActionSelect: (actionId: string) => void;
  disabled: boolean;
}

export function ActionButtons({ actions, onActionSelect, disabled }: ActionButtonsProps) {
  const getActionName = (actionId: string) => {
    const actionMap: Record<string, string> = {
      'check-portfolio': 'Check Portfolio',
      'buy-dip': 'Buy the Dip',
      'go-sleep': 'Go to Sleep',
      'touch-grass': 'Touch Grass',
      'open-telegram': 'Open Telegram',
      'post-x': 'Post on X',
      'listen-influencer': 'Listen to Influencer',
      'sell-peace': 'Sell for Peace',
      'ape-coin': 'Ape New Coin',
    };
    return actionMap[actionId] || actionId;
  };

  return (
    <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto">
      {actions.map((actionId, index) => (
        <motion.button
          key={actionId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={() => !disabled && onActionSelect(actionId)}
          disabled={disabled}
          className={`
            relative px-6 py-4 rounded-xl font-medium text-left
            transition-all duration-200
            ${disabled 
              ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed' 
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'
            }
          `}
        >
          <span className="text-sm">{getActionName(actionId)}</span>
          
          {!disabled && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}