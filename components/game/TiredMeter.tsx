import { motion } from 'framer-motion';

interface TiredMeterProps {
  tired: number;
}

export function TiredMeter({ tired }: TiredMeterProps) {
  const percentage = Math.min(tired, 100);
  
  const getColor = () => {
    if (percentage < 30) return 'from-emerald-500 to-emerald-400';
    if (percentage < 60) return 'from-amber-500 to-yellow-400';
    if (percentage < 85) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-600';
  };

  const getLabel = () => {
    if (percentage < 20) return 'Fresh';
    if (percentage < 40) return 'Tired';
    if (percentage < 60) return 'Exhausted';
    if (percentage < 80) return 'Burnt Out';
    if (percentage < 100) return 'Critical';
    return 'Collapse';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-zinc-500">Tired Level</span>
        <span className={`text-lg font-bold ${percentage >= 85 ? 'text-red-400' : 'text-zinc-100'}`}>
          {Math.round(percentage)}%
        </span>
      </div>
      
      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {percentage >= 80 && (
          <motion.div
            className="absolute inset-0 bg-red-500/20 blur-md"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      
      <div className="mt-1 text-xs text-zinc-500 text-right">
        {getLabel()}
      </div>
    </div>
  );
}