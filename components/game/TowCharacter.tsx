import { motion } from 'framer-motion';
import { Mood } from './content';

interface TowCharacterProps {
  mood: Mood;
  vfxType?: string;
}

export function TowCharacter({ mood, vfxType }: TowCharacterProps) {
  const getAnimation = () => {
    switch (vfxType) {
      case 'shake': return { animate: { x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.4 } } };
      case 'zzz': return { animate: { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity } } };
      case 'leaf-drift': return { animate: { rotate: [0, 2, -2, 0], transition: { duration: 3, repeat: Infinity } } };
      case 'jitter': return { animate: { x: [0, -2, 2, -1, 1, 0], transition: { duration: 0.3, repeat: 2 } } };
      case 'spotlight': return { animate: { scale: [1, 1.05, 1], transition: { duration: 0.8 } } };
      case 'green-pop': return { animate: { scale: [1, 1.1, 1], transition: { duration: 0.5 } } };
      case 'red-flicker': return { animate: { opacity: [1, 0.7, 1], transition: { duration: 0.3, repeat: 2 } } };
      case 'fake-gain-collapse': return { animate: { y: [0, -10, 5, 0], scale: [1, 1.05, 0.95, 1], transition: { duration: 0.8 } } };
      case 'dust-puff': return { animate: { opacity: [1, 0.7, 1], scale: [1, 0.95, 1], transition: { duration: 1 } } };
      case 'gold-shine': return { animate: { scale: [1, 1.08, 1], transition: { duration: 0.6 } } };
      default: return { animate: { y: [0, -2, 0], transition: { duration: 3, repeat: Infinity } } };
    }
  };

  const animProps = getAnimation();

  return (
    <motion.div className="relative w-48 h-48 mx-auto" initial={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.5 }} {...animProps}>
      {mood === 'neutral' && <NeutralTOW />}
      {mood === 'stressed' && <StressedTOW />}
      {mood === 'hopeful' && <HopefulTOW />}
      {mood === 'broken' && <BrokenTOW />}
      {mood === 'confused' && <ConfusedTOW />}
      {mood === 'euphoric' && <EuphoricTOW />}
      {mood === 'sleepy' && <SleepyTOW />}
      {mood === 'regret' && <RegretTOW />}
      
      {mood === 'euphoric' && <motion.div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />}
      {mood === 'broken' && <motion.div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />}
    </motion.div>
  );
}

function NeutralTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="140" rx="50" ry="45" fill="#2a2a2e" />
      <circle cx="100" cy="80" r="40" fill="#3a3a3e" />
      <ellipse cx="85" cy="75" rx="8" ry="5" fill="#fafafa" />
      <ellipse cx="115" cy="75" rx="8" ry="5" fill="#fafafa" />
      <circle cx="85" cy="75" r="3" fill="#0f0f11" />
      <circle cx="115" cy="75" r="3" fill="#0f0f11" />
      <path d="M 77 82 Q 85 85 93 82" stroke="#555" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M 107 82 Q 115 85 123 82" stroke="#555" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M 90 100 Q 100 102 110 100" stroke="#666" strokeWidth="3" fill="none" strokeLinecap="round" />
      <motion.circle cx="100" cy="80" r="40" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.2" animate={{ r: [40, 42, 40], opacity: [0.2, 0.1, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
    </svg>
  );
}

function StressedTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="140" rx="50" ry="45" fill="#2a2a2e" />
      <circle cx="100" cy="80" r="40" fill="#3a3a3e" />
      <circle cx="85" cy="75" r="9" fill="#fafafa" />
      <circle cx="115" cy="75" r="9" fill="#fafafa" />
      <circle cx="85" cy="75" r="4" fill="#0f0f11" />
      <circle cx="115" cy="75" r="4" fill="#0f0f11" />
      <path d="M 78 68 L 92 72" stroke="#666" strokeWidth="2" strokeLinecap="round" />
      <path d="M 122 68 L 108 72" stroke="#666" strokeWidth="2" strokeLinecap="round" />
      <path d="M 92 100 L 108 100" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <motion.path d="M 70 60 L 65 55" stroke="#ef4444" strokeWidth="2" opacity="0.6" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 0.5, repeat: Infinity }} />
      <motion.path d="M 130 60 L 135 55" stroke="#ef4444" strokeWidth="2" opacity="0.6" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
    </svg>
  );
}

function HopefulTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="140" rx="50" ry="45" fill="#2a2a2e" />
      <circle cx="100" cy="80" r="40" fill="#3a3a3e" />
      <circle cx="85" cy="75" r="9" fill="#fafafa" />
      <circle cx="115" cy="75" r="9" fill="#fafafa" />
      <circle cx="85" cy="75" r="4" fill="#0f0f11" />
      <circle cx="115" cy="75" r="4" fill="#0f0f11" />
      <circle cx="87" cy="73" r="2" fill="#10b981" opacity="0.8" />
      <circle cx="117" cy="73" r="2" fill="#10b981" opacity="0.8" />
      <path d="M 90 98 Q 100 106 110 98" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BrokenTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="145" rx="50" ry="40" fill="#2a2a2e" />
      <circle cx="100" cy="85" r="38" fill="#3a3a3e" />
      <circle cx="85" cy="80" r="8" fill="#fafafa" opacity="0.5" />
      <circle cx="115" cy="80" r="8" fill="#fafafa" opacity="0.5" />
      <circle cx="85" cy="80" r="2" fill="#0f0f11" />
      <circle cx="115" cy="80" r="2" fill="#0f0f11" />
      <path d="M 81 76 L 89 84" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M 89 76 L 81 84" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M 111 76 L 119 84" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M 119 76 L 111 84" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M 92 100 L 108 100" stroke="#666" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ConfusedTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="140" rx="50" ry="45" fill="#2a2a2e" />
      <circle cx="100" cy="80" r="40" fill="#3a3a3e" />
      <circle cx="85" cy="75" r="8" fill="#fafafa" />
      <circle cx="115" cy="73" r="9" fill="#fafafa" />
      <circle cx="85" cy="75" r="3" fill="#0f0f11" />
      <circle cx="115" cy="73" r="3" fill="#0f0f11" />
      <motion.text x="130" y="50" fontSize="24" fill="#f59e0b" opacity="0.7" animate={{ y: [50, 45, 50], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>?</motion.text>
      <path d="M 92 100 Q 100 98 108 101" stroke="#666" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function EuphoricTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="135" rx="50" ry="45" fill="#2a2a2e" />
      <circle cx="100" cy="75" r="40" fill="#3a3a3e" />
      <motion.g animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
        <polygon points="85,70 87,76 93,76 88,80 90,86 85,82 80,86 82,80 77,76 83,76" fill="#f59e0b" />
        <polygon points="115,70 117,76 123,76 118,80 120,86 115,82 110,86 112,80 107,76 113,76" fill="#f59e0b" />
      </motion.g>
      <path d="M 85 95 Q 100 110 115 95" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <motion.circle cx="100" cy="75" r="45" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.4" animate={{ r: [45, 50, 45], opacity: [0.4, 0.2, 0.4] }} transition={{ duration: 1, repeat: Infinity }} />
    </svg>
  );
}

function SleepyTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="142" rx="50" ry="43" fill="#2a2a2e" />
      <circle cx="100" cy="82" r="39" fill="#3a3a3e" />
      <path d="M 78 75 Q 85 78 92 75" stroke="#666" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 108 75 Q 115 78 122 75" stroke="#666" strokeWidth="3" fill="none" strokeLinecap="round" />
      <motion.text x="130" y="60" fontSize="18" fill="#6366f1" opacity="0.7" animate={{ y: [60, 40, 60], opacity: [0.7, 0.3, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>Z</motion.text>
      <motion.text x="140" y="50" fontSize="14" fill="#6366f1" opacity="0.5" animate={{ y: [50, 30, 50], opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>z</motion.text>
      <path d="M 95 98 Q 100 100 105 98" stroke="#666" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function RegretTOW() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="143" rx="50" ry="42" fill="#2a2a2e" />
      <circle cx="100" cy="83" r="38" fill="#3a3a3e" />
      <ellipse cx="85" cy="78" rx="7" ry="4" fill="#fafafa" opacity="0.6" />
      <ellipse cx="115" cy="78" rx="7" ry="4" fill="#fafafa" opacity="0.6" />
      <circle cx="85" cy="79" r="2" fill="#0f0f11" />
      <circle cx="115" cy="79" r="2" fill="#0f0f11" />
      <path d="M 90 102 Q 100 96 110 102" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
      <motion.circle cx="82" cy="85" r="2" fill="#6366f1" opacity="0.6" animate={{ cy: [85, 95, 85], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  );
}