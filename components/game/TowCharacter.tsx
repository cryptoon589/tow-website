import { motion } from 'framer-motion';
import { Mood } from './content';

interface TowCharacterProps {
  mood: Mood;
  vfxType?: string;
}

const EASE = [0.42, 0, 0.58, 1] as const;

export function TowCharacter({ mood, vfxType }: TowCharacterProps) {
  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ width: 240, height: 300 }}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={getOuterAnimate(vfxType)}
      transition={getOuterTransition(vfxType)}
    >
      <motion.svg
        width="240"
        height="300"
        viewBox="0 0 240 300"
        className="block overflow-visible"
        animate={{
          y: [0, -2, 0],
          rotate: mood === 'confused' ? [0, 1, -1, 0] : [0, 0.4, -0.4, 0],
        }}
        transition={{
          duration: mood === 'sleepy' ? 3.2 : 2.6,
          repeat: Infinity,
          ease: EASE,
        }}
      >
        {/* shadow */}
        <ellipse cx="120" cy="282" rx="34" ry="8" fill="rgba(30,27,24,0.10)" />

        {/* stress / mood marks */}
        {mood === 'stressed' && (
          <>
            <path d="M 58 70 L 50 60" stroke="#E56B6F" strokeWidth="3" strokeLinecap="round" />
            <path d="M 182 68 L 190 58" stroke="#E56B6F" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {mood === 'confused' && (
          <text x="186" y="72" fontSize="24" fill="#7C6CF2">?</text>
        )}

        {mood === 'sleepy' && (
          <>
            <text x="182" y="78" fontSize="20" fill="#7C6CF2">Z</text>
            <text x="196" y="60" fontSize="15" fill="#7C6CF2">z</text>
          </>
        )}

        {/* left arm */}
        <path
          d="M 94 164 Q 80 205 84 254"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* torso */}
        <path
          d="M 106 150 L 144 155 L 149 244 L 103 242 Z"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* hip line */}
        <path
          d="M 102 243 L 148 244"
          fill="none"
          stroke="#111111"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* legs */}
        <path
          d="M 112 244 L 111 281"
          fill="none"
          stroke="#111111"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 145 244 Q 149 257 149 275"
          fill="none"
          stroke="#111111"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* right arm */}
        <path
          d="M 144 163 Q 161 190 175 210 Q 182 220 191 216"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* hand */}
        <path
          d="M 191 216 Q 197 212 197 204 Q 197 196 190 192"
          fill="none"
          stroke="#111111"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* phone */}
        <g transform={`rotate(${getPhoneTilt(mood)} 193 191)`}>
          <rect x="181" y="170" width="27" height="42" rx="4" fill="#111111" />
          <circle cx="187" cy="176" r="1.8" fill="#FFFCF8" />
        </g>

        {/* head */}
        <g transform={`translate(0 ${mood === 'broken' ? 6 : mood === 'sleepy' ? 4 : 0})`}>
          <path
            d="M 118 44
               Q 151 43 166 69
               Q 179 92 171 120
               Q 162 150 136 161
               Q 106 172 82 153
               Q 57 135 57 103
               Q 57 74 74 57
               Q 90 42 118 44 Z"
            fill="#FFFCF8"
            stroke="#111111"
            strokeWidth="8"
            strokeLinejoin="round"
          />

          {/* scribble hair */}
          <path
            d="M 93 57
               L 104 52
               L 115 56
               L 127 54
               L 136 60
               L 128 63
               L 117 61
               L 106 65
               L 96 62
               L 87 63
               Z"
            fill="#111111"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* eyebrows */}
          {getBrows(mood).left && (
            <path
              d={getBrows(mood).left}
              fill="none"
              stroke="#111111"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {getBrows(mood).right && (
            <path
              d={getBrows(mood).right}
              fill="none"
              stroke="#111111"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {/* eyes */}
          {mood === 'sleepy' ? (
            <>
              <path
                d="M 87 103 Q 95 107 103 103"
                fill="none"
                stroke="#111111"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 120 103 Q 128 107 136 103"
                fill="none"
                stroke="#111111"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          ) : mood === 'euphoric' ? (
            <>
              <path
                d="M 88 101 L 92 108 L 100 108 L 94 113 L 97 120 L 88 115 L 80 120 L 83 113 L 77 108 L 85 108 Z"
                fill="#F2A93B"
                stroke="#111111"
                strokeWidth="2"
              />
              <path
                d="M 121 101 L 125 108 L 133 108 L 127 113 L 130 120 L 121 115 L 113 120 L 116 113 L 110 108 L 118 108 Z"
                fill="#F2A93B"
                stroke="#111111"
                strokeWidth="2"
              />
            </>
          ) : (
            <>
              <circle cx="95" cy={mood === 'broken' ? 106 : 104} r={mood === 'stressed' ? 5.6 : 4.8} fill="#111111" />
              <circle cx="128" cy={mood === 'broken' ? 106 : 104} r={mood === 'stressed' ? 5.6 : 4.8} fill="#111111" />
            </>
          )}

          {/* tear */}
          {mood === 'regret' && (
            <path
              d="M 89 116 Q 87 124 91 130"
              fill="none"
              stroke="#7C6CF2"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* hope dots */}
          {mood === 'hopeful' && (
            <>
              <circle cx="82" cy="118" r="3.2" fill="#58B889" opacity="0.45" />
              <circle cx="141" cy="118" r="3.2" fill="#58B889" opacity="0.45" />
            </>
          )}

          {/* mouth */}
          <path
            d={getMouth(mood)}
            fill="none"
            stroke="#111111"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </motion.svg>
    </motion.div>
  );
}

function getOuterAnimate(vfxType?: string) {
  switch (vfxType) {
    case 'shake':
      return { x: [0, -5, 5, -4, 4, 0], rotate: [0, -1, 1, -1, 1, 0] };
    case 'jitter':
      return { x: [0, -2, 2, -1, 1, 0] };
    case 'fake-gain-collapse':
      return { y: [0, -10, 8, 0], scale: [1, 1.03, 0.97, 1] };
    case 'green-pop':
      return { scale: [1, 1.04, 1] };
    case 'gold-shine':
      return { scale: [1, 1.06, 1], rotate: [0, 0.6, 0] };
    case 'red-flicker':
      return { opacity: [1, 0.72, 1] };
    case 'dust-puff':
      return { y: [0, 2, 0], opacity: [1, 0.88, 1] };
    case 'zzz':
      return { y: [0, -3, 0] };
    case 'leaf-drift':
      return { rotate: [0, 1.2, -1.2, 0] };
    case 'spotlight':
      return { scale: [1, 1.035, 1] };
    default:
      return { opacity: 1 };
  }
}

function getOuterTransition(vfxType?: string) {
  switch (vfxType) {
    case 'jitter':
      return { duration: 0.32, repeat: 2 };
    case 'red-flicker':
      return { duration: 0.24, repeat: 2 };
    case 'zzz':
      return { duration: 2.2, repeat: Infinity, ease: EASE };
    case 'leaf-drift':
      return { duration: 3, repeat: Infinity, ease: EASE };
    case 'shake':
      return { duration: 0.45 };
    case 'fake-gain-collapse':
      return { duration: 0.75 };
    case 'green-pop':
      return { duration: 0.45 };
    case 'gold-shine':
      return { duration: 0.55 };
    case 'dust-puff':
      return { duration: 0.8 };
    case 'spotlight':
      return { duration: 0.75 };
    default:
      return { duration: 0.2 };
  }
}

function getPhoneTilt(mood: Mood) {
  if (mood === 'stressed') return 6;
  if (mood === 'euphoric') return -10;
  return -4;
}

function getBrows(mood: Mood) {
  switch (mood) {
    case 'stressed':
      return { left: 'M 86 93 L 98 97', right: 'M 137 93 L 125 97' };
    case 'hopeful':
      return { left: 'M 87 94 L 98 94', right: 'M 125 94 L 136 94' };
    case 'broken':
      return { left: 'M 87 95 L 98 99', right: 'M 137 95 L 126 99' };
    case 'confused':
      return { left: 'M 86 95 L 97 93', right: 'M 126 91 L 138 95' };
    case 'regret':
      return { left: 'M 87 95 L 98 99', right: 'M 136 95 L 125 99' };
    default:
      return { left: '', right: '' };
  }
}

function getMouth(mood: Mood) {
  switch (mood) {
    case 'stressed':
      return 'M 104 130 L 122 130';
    case 'hopeful':
      return 'M 102 129 Q 112 135 123 129';
    case 'broken':
      return 'M 102 132 Q 112 128 122 132';
    case 'confused':
      return 'M 104 132 Q 112 128 121 131';
    case 'euphoric':
      return 'M 98 127 Q 112 140 127 127';
    case 'sleepy':
      return 'M 106 131 Q 112 134 118 131';
    case 'regret':
      return 'M 102 133 Q 112 126 123 133';
    case 'neutral':
    default:
      return 'M 104 130 L 121 130';
  }
}