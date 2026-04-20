import { motion } from 'framer-motion';

interface ParticlesProps {
  type: 'zzz' | 'leaf' | 'sparkle' | 'dust' | 'none';
}

export function Particles({ type }: ParticlesProps) {
  if (type === 'none') return null;

  if (type === 'zzz') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-indigo-400 font-bold"
            style={{ left: `${60 + i * 8}%`, top: '20%', fontSize: `${16 - i * 2}px` }}
            animate={{ y: [0, -80 - i * 20], x: [0, 20 + i * 5], opacity: [0.7, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
          >
            {i === 0 ? 'Z' : i === 1 ? 'z' : 'z'}
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'leaf') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-emerald-400/40 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: '-10%' }}
            animate={{ y: ['0vh', '100vh'], x: [0, Math.sin(i) * 50], rotate: [0, 360], opacity: [0.6, 0] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: i * 0.5, ease: 'linear' }}
          />
        ))}
      </div>
    );
  }

  if (type === 'sparkle') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{ left: `${50 + (Math.random() - 0.5) * 40}%`, top: `${50 + (Math.random() - 0.5) * 40}%` }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeOut' }}
          />
        ))}
      </div>
    );
  }

  if (type === 'dust') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-zinc-500/30 rounded-full"
            style={{ left: `${50 + (Math.random() - 0.5) * 60}%`, top: `${50 + (Math.random() - 0.5) * 60}%` }}
            animate={{ x: [(Math.random() - 0.5) * 100], y: [(Math.random() - 0.5) * 100], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: 'easeOut' }}
          />
        ))}
      </div>
    );
  }

  return null;
}