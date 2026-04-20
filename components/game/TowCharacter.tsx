import { motion } from 'framer-motion';
import { Mood } from './content';

interface TowCharacterProps {
  mood: Mood;
  vfxType?: string;
}

type DoodleFaceConfig = {
  eyeY?: number;
  mouthPath: string;
  browLeft?: string;
  browRight?: string;
  blush?: boolean;
  tear?: boolean;
  question?: boolean;
  sleepy?: boolean;
  euphoric?: boolean;
  stressed?: boolean;
};

const EASE_IN_OUT = [0.42, 0, 0.58, 1] as const;

export function TowCharacter({ mood, vfxType }: TowCharacterProps) {
  const animation = getWrapperAnimation(vfxType, mood);

  return (
    <motion.div
      className="relative w-[220px] h-[280px] mx-auto select-none"
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={animation.animate}
      transition={animation.transition}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          y: [0, -2, 0],
          rotate: [0, 0.4, -0.4, 0],
        }}
        transition={{
          duration: mood === 'sleepy' ? 3.6 : 2.8,
          repeat: Infinity,
          ease: EASE_IN_OUT,
        }}
      >
        <DoodleTow mood={mood} />
      </motion.div>

      {(mood === 'hopeful' || mood === 'euphoric') && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#E8E2FF] blur-2xl -z-10"
          animate={{ opacity: [0.18, 0.34, 0.18], scale: [0.96, 1.02, 0.96] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      )}

      {(mood === 'broken' || mood === 'regret') && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[#F7D6D8] blur-2xl -z-10"
          animate={{ opacity: [0.14, 0.24, 0.14] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function getWrapperAnimation(vfxType?: string, mood?: Mood) {
  switch (vfxType) {
    case 'shake':
      return {
        animate: { x: [0, -5, 5, -4, 4, 0], rotate: [0, -1, 1, -1, 1, 0] },
        transition: { duration: 0.45 },
      };
    case 'jitter':
      return {
        animate: { x: [0, -2, 2, -1, 1, 0] },
        transition: { duration: 0.32, repeat: 2 },
      };
    case 'fake-gain-collapse':
      return {
        animate: { y: [0, -10, 8, 0], scale: [1, 1.03, 0.97, 1] },
        transition: { duration: 0.75 },
      };
    case 'green-pop':
      return {
        animate: { scale: [1, 1.04, 1] },
        transition: { duration: 0.45 },
      };
    case 'gold-shine':
      return {
        animate: { scale: [1, 1.06, 1], rotate: [0, 0.6, 0] },
        transition: { duration: 0.55 },
      };
    case 'red-flicker':
      return {
        animate: { opacity: [1, 0.72, 1] },
        transition: { duration: 0.24, repeat: 2 },
      };
    case 'dust-puff':
      return {
        animate: { y: [0, 2, 0], opacity: [1, 0.88, 1] },
        transition: { duration: 0.8 },
      };
    case 'zzz':
      return {
        animate: { y: [0, -3, 0] },
        transition: { duration: 2.2, repeat: Infinity },
      };
    case 'leaf-drift':
      return {
        animate: { rotate: [0, 1.2, -1.2, 0] },
        transition: { duration: 3, repeat: Infinity },
      };
    case 'spotlight':
      return {
        animate: { scale: [1, 1.035, 1] },
        transition: { duration: 0.75 },
      };
    default:
      return {
        animate: {
          y: [0, mood === 'broken' ? 1 : -1.5, 0],
        },
        transition: {
          duration: mood === 'sleepy' ? 3.2 : 2.8,
          repeat: Infinity,
          ease: EASE_IN_OUT,
        },
      };
  }
}

function DoodleTow({ mood }: { mood: Mood }) {
  const face = getFaceConfig(mood);

  const headY = mood === 'broken' ? 6 : mood === 'sleepy' ? 4 : 0;
  const bodyTilt = mood === 'regret' ? -2 : mood === 'hopeful' ? 1.2 : 0;
  const phoneTilt = mood === 'stressed' ? 6 : mood === 'euphoric' ? -10 : -4;

  return (
    <svg viewBox="0 0 240 300" className="w-full h-full overflow-visible">
      <ellipse cx="122" cy="284" rx="34" ry="8" fill="rgba(30,27,24,0.08)" />

      {face.question && (
        <motion.text
          x="188"
          y="70"
          fontSize="24"
          fill="#7C6CF2"
          animate={{ y: [70, 64, 70], rotate: [0, 6, -6, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          ?
        </motion.text>
      )}

      {face.sleepy && (
        <>
          <motion.text
            x="182"
            y="76"
            fontSize="20"
            fill="#7C6CF2"
            animate={{ y: [76, 60, 76], opacity: [0.7, 0.25, 0.7] }}
            transition={{ duration: 2.1, repeat: Infinity }}
          >
            Z
          </motion.text>
          <motion.text
            x="196"
            y="58"
            fontSize="15"
            fill="#7C6CF2"
            animate={{ y: [58, 42, 58], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.1, repeat: Infinity, delay: 0.35 }}
          >
            z
          </motion.text>
        </>
      )}

      {face.stressed && (
        <>
          <motion.path
            d="M 62 70 L 54 60"
            stroke="#E56B6F"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          />
          <motion.path
            d="M 178 68 L 186 58"
            stroke="#E56B6F"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.25, 0.75, 0.25] }}
            transition={{ duration: 0.45, repeat: Infinity, delay: 0.15 }}
          />
        </>
      )}

      <g transform={`translate(0 ${headY}) rotate(${bodyTilt} 122 170)`}>
        <path
          d="M 96 165 Q 80 205 86 256"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 107 151 L 145 156 L 150 246 L 103 244 Z"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <path
          d="M 101 244 L 148 245"
          fill="none"
          stroke="#111111"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d="M 113 245 L 112 282"
          fill="none"
          stroke="#111111"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <path
          d="M 146 245 Q 150 258 150 276"
          fill="none"
          stroke="#111111"
          strokeWidth="10"
          strokeLinecap="round"
        />

        <path
          d="M 145 164 Q 163 192 176 212 Q 183 223 192 218"
          fill="none"
          stroke="#111111"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M 192 218 Q 198 214 198 206 Q 198 198 191 194"
          fill="none"
          stroke="#111111"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <g transform={`rotate(${phoneTilt} 194 192)`}>
          <rect
            x="182"
            y="171"
            width="27"
            height="42"
            rx="4"
            fill="#111111"
          />
          <circle cx="188" cy="177" r="1.8" fill="#FFFCF8" />
        </g>

        <motion.g
          animate={{
            rotate:
              mood === 'confused'
                ? [0, 1.4, -1.4, 0]
                : mood === 'sleepy'
                ? [0, -1, 0]
                : [0, 0.5, -0.5, 0],
          }}
          transition={{
            duration: mood === 'confused' ? 1.8 : 2.8,
            repeat: Infinity,
            ease: EASE_IN_OUT,
          }}
          style={{ originX: '122px', originY: '96px' }}
        >
          <path
            d="M 118 45
               Q 151 44 166 70
               Q 179 93 171 121
               Q 162 151 136 162
               Q 106 173 82 154
               Q 57 136 57 104
               Q 57 75 74 58
               Q 90 43 118 45 Z"
            fill="#FFFCF8"
            stroke="#111111"
            strokeWidth="8"
            strokeLinejoin="round"
          />

          <path
            d="M 93 58
               L 104 53
               L 115 57
               L 127 55
               L 136 61
               L 128 64
               L 117 62
               L 106 66
               L 96 63
               L 87 64
               Z"
            fill="#111111"
            stroke="#111111"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {face.browLeft && (
            <path
              d={face.browLeft}
              fill="none"
              stroke="#111111"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {face.browRight && (
            <path
              d={face.browRight}
              fill="none"
              stroke="#111111"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {!face.euphoric && !face.sleepy && (
            <>
              <motion.circle
                cx="95"
                cy={face.eyeY ?? 104}
                r={mood === 'stressed' ? 5.6 : 4.8}
                fill="#111111"
                animate={mood === 'hopeful' ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <motion.circle
                cx="128"
                cy={face.eyeY ?? 104}
                r={mood === 'stressed' ? 5.6 : 4.8}
                fill="#111111"
                animate={mood === 'hopeful' ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity, delay: 0.1 }}
              />
            </>
          )}

          {face.sleepy && (
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
          )}

          {face.euphoric && (
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
          )}

          {face.tear && (
            <motion.path
              d="M 89 116 Q 87 124 91 130"
              fill="none"
              stroke="#7C6CF2"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ opacity: [0.7, 0.2, 0.7], y: [0, 1.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          )}

          {face.blush && (
            <>
              <circle cx="82" cy="118" r="3.2" fill="#58B889" opacity="0.45" />
              <circle cx="141" cy="118" r="3.2" fill="#58B889" opacity="0.45" />
            </>
          )}

          <path
            d={face.mouthPath}
            fill="none"
            stroke="#111111"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </motion.g>
      </g>
    </svg>
  );
}

function getFaceConfig(mood: Mood): DoodleFaceConfig {
  switch (mood) {
    case 'stressed':
      return {
        mouthPath: 'M 104 130 L 122 130',
        browLeft: 'M 86 93 L 98 97',
        browRight: 'M 137 93 L 125 97',
        stressed: true,
      };
    case 'hopeful':
      return {
        mouthPath: 'M 102 129 Q 112 135 123 129',
        browLeft: 'M 87 94 L 98 94',
        browRight: 'M 125 94 L 136 94',
        blush: true,
      };
    case 'broken':
      return {
        mouthPath: 'M 102 132 Q 112 128 122 132',
        eyeY: 106,
        browLeft: 'M 87 95 L 98 99',
        browRight: 'M 137 95 L 126 99',
      };
    case 'confused':
      return {
        mouthPath: 'M 104 132 Q 112 128 121 131',
        browLeft: 'M 86 95 L 97 93',
        browRight: 'M 126 91 L 138 95',
        question: true,
      };
    case 'euphoric':
      return {
        mouthPath: 'M 98 127 Q 112 140 127 127',
        euphoric: true,
      };
    case 'sleepy':
      return {
        mouthPath: 'M 106 131 Q 112 134 118 131',
        sleepy: true,
      };
    case 'regret':
      return {
        mouthPath: 'M 102 133 Q 112 126 123 133',
        browLeft: 'M 87 95 L 98 99',
        browRight: 'M 136 95 L 125 99',
        tear: true,
      };
    case 'neutral':
    default:
      return {
        mouthPath: 'M 104 130 L 121 130',
      };
  }
}