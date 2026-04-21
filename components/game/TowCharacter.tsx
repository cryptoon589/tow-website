'use client';

import { motion } from 'framer-motion';
import { Mood } from './content';

interface TowCharacterProps {
  mood: Mood;
  vfxType?: string;
  preAction?: string | null;
}

const EASE = [0.42, 0, 0.58, 1] as const;

export function TowCharacter({
  mood,
  vfxType,
  preAction,
}: TowCharacterProps) {
  const anticipation = getPreActionPose(preAction);
  const outcomePose = getPostOutcomePose(mood, vfxType);
  const phoneGlow = getPhoneGlow(mood, vfxType, preAction);

  const outerY = preAction
    ? anticipation.bodyY
    : [0, outcomePose.bodyY, 0, -1.5, 0];

  const outerScale = preAction
    ? 1
    : [1, outcomePose.scale, 1, 1.003, 1];

  const bodyRotate = preAction
    ? anticipation.bodyRotate
    : [0, outcomePose.bodyRotate, 0];

  const headRotate = preAction
    ? anticipation.headRotate
    : [0, outcomePose.headRotate, 0, mood === 'confused' ? 1 : 0, 0];

  const phoneRotate = preAction
    ? anticipation.phoneRotate
    : [getPhoneTilt(mood), outcomePose.phoneRotate, getPhoneTilt(mood)];

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{ width: 240, height: 300 }}
      animate={{
        y: outerY,
        scale: outerScale,
        opacity: vfxType === 'red-flicker' ? [1, 0.94, 1] : 1,
      }}
      transition={{
        duration: preAction ? 0.2 : 1.15,
        repeat: 0,
        ease: EASE,
      }}
    >
      <motion.svg
        width="240"
        height="300"
        viewBox="0 0 240 300"
        className="block overflow-visible"
      >
        <defs>
          <radialGradient id="phoneGlowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={phoneGlow.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={phoneGlow.color} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="120" cy="282" rx="34" ry="8" fill="rgba(0,0,0,0.08)" />

        {/* BODY */}
        <motion.g
          animate={{ rotate: bodyRotate }}
          transition={{
            duration: preAction ? 0.2 : 1.05,
            repeat: 0,
            ease: EASE,
          }}
          style={{ originX: '120px', originY: '170px' }}
        >
          <path
            d="M 100 140 L 140 140 L 145 240 L 95 240 Z"
            fill="none"
            stroke="#111"
            strokeWidth="8"
            strokeLinecap="round"
          />

          <path
            d="M 110 240 L 110 280"
            stroke="#111"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 140 240 L 142 280"
            stroke="#111"
            strokeWidth="8"
            strokeLinecap="round"
          />

          <path
            d="M 100 150 Q 80 200 90 250"
            stroke="#111"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />

          <path
            d="M 140 150 Q 170 190 185 200"
            stroke="#111"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />

          {/* PHONE + GLOW */}
          <motion.g
            animate={{ rotate: phoneRotate }}
            transition={{
              duration: preAction ? 0.2 : 0.95,
              repeat: 0,
              ease: EASE,
            }}
            style={{ originX: '190px', originY: '200px' }}
          >
            <motion.circle
              cx="190"
              cy="200"
              r="18"
              fill="url(#phoneGlowGradient)"
              animate={{
                opacity: phoneGlow.opacity,
                scale: phoneGlow.scale,
              }}
              transition={{
                duration: preAction ? 0.2 : 0.9,
                repeat: 0,
                ease: EASE,
              }}
            />
            <rect x="180" y="180" width="20" height="40" rx="4" fill="#111" />
            <motion.rect
              x="183"
              y="184"
              width="14"
              height="28"
              rx="2.5"
              fill={phoneGlow.color}
              animate={{
                opacity: phoneGlow.screenOpacity,
              }}
              transition={{
                duration: preAction ? 0.2 : 0.9,
                repeat: 0,
                ease: EASE,
              }}
            />
            <circle cx="185" cy="186" r="2" fill="#fff" />
          </motion.g>
        </motion.g>

        {/* HEAD */}
        <motion.g
          animate={{ rotate: headRotate }}
          transition={{
            duration: preAction ? 0.2 : 1.05,
            repeat: 0,
            ease: EASE,
          }}
          style={{ originX: '120px', originY: '95px' }}
        >
          <circle
            cx="120"
            cy="95"
            r="40"
            fill="#fff"
            stroke="#111"
            strokeWidth="8"
          />

          <path
            d="M 95 70 L 110 60 L 125 68 L 140 62 L 155 72 L 140 78 L 125 75 L 110 82 Z"
            fill="#111"
          />

          <BlinkingEyes mood={mood} preAction={preAction} />

          <path
            d={getMouth(mood)}
            stroke="#111"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {mood === 'sleepy' && (
          <>
            <motion.text
              x="170"
              y="70"
              fontSize="20"
              animate={{ y: [70, 62, 70], opacity: [0.55, 0.9, 0.55] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: EASE }}
            >
              Z
            </motion.text>
            <motion.text
              x="190"
              y="55"
              fontSize="14"
              animate={{ y: [55, 45, 55], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.15, ease: EASE }}
            >
              z
            </motion.text>
          </>
        )}

        {mood === 'confused' && (
          <motion.text
            x="175"
            y="80"
            fontSize="22"
            animate={{ rotate: [0, 6, -6, 0], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: EASE }}
            style={{ originX: '180px', originY: '75px' }}
          >
            ?
          </motion.text>
        )}

        {mood === 'regret' && (
          <motion.path
            d="M 105 120 Q 102 130 106 138"
            stroke="#7C6CF2"
            strokeWidth="3"
            fill="none"
            animate={{ opacity: [0.5, 0.95, 0.5], y: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: EASE }}
          />
        )}
      </motion.svg>
    </motion.div>
  );
}

function BlinkingEyes({
  mood,
  preAction,
}: {
  mood: Mood;
  preAction?: string | null;
}) {
  if (mood === 'sleepy') {
    return (
      <>
        <path
          d="M 98 100 Q 105 104 112 100"
          fill="none"
          stroke="#111"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 128 100 Q 135 104 142 100"
          fill="none"
          stroke="#111"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (mood === 'euphoric') {
    return (
      <>
        <path
          d="M 98 95 L 102 102 L 110 102 L 104 107 L 107 114 L 98 109 L 90 114 L 93 107 L 87 102 L 95 102 Z"
          fill="#F2A93B"
          stroke="#111"
          strokeWidth="2"
        />
        <path
          d="M 128 95 L 132 102 L 140 102 L 134 107 L 137 114 L 128 109 L 120 114 L 123 107 L 117 102 L 125 102 Z"
          fill="#F2A93B"
          stroke="#111"
          strokeWidth="2"
        />
      </>
    );
  }

  const blinkDuration = preAction ? 100 : 3;

  return (
    <>
      <motion.circle
        cx="105"
        cy="100"
        r={mood === 'stressed' ? 5.6 : 5}
        fill="#111"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{
          duration: blinkDuration,
          repeat: Infinity,
          ease: EASE,
        }}
        style={{ originX: '105px', originY: '100px' }}
      />
      <motion.circle
        cx="135"
        cy="100"
        r={mood === 'stressed' ? 5.6 : 5}
        fill="#111"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{
          duration: blinkDuration,
          repeat: Infinity,
          delay: 0.2,
          ease: EASE,
        }}
        style={{ originX: '135px', originY: '100px' }}
      />
    </>
  );
}

function getMouth(mood: Mood) {
  switch (mood) {
    case 'hopeful':
      return 'M 105 125 Q 120 135 135 125';
    case 'broken':
      return 'M 105 130 Q 120 120 135 130';
    case 'regret':
      return 'M 105 130 Q 120 118 135 130';
    case 'sleepy':
      return 'M 110 128 Q 120 132 130 128';
    case 'confused':
      return 'M 110 130 Q 118 125 126 130';
    case 'stressed':
      return 'M 110 128 L 130 128';
    default:
      return 'M 110 128 L 130 128';
  }
}

function getPhoneTilt(mood: Mood) {
  if (mood === 'stressed') return 8;
  if (mood === 'hopeful') return -5;
  if (mood === 'regret') return 2;
  if (mood === 'broken') return 5;
  if (mood === 'euphoric') return -8;
  return -2;
}

function getPhoneGlow(
  mood: Mood,
  vfxType?: string,
  preAction?: string | null
) {
  if (preAction === 'check-portfolio') {
    return {
      color: '#8EA3C0',
      opacity: [0.1, 0.22, 0.1],
      scale: [0.95, 1.08, 0.98],
      screenOpacity: [0.16, 0.3, 0.16],
    };
  }

  if (preAction === 'buy-dip') {
    return {
      color: '#58B889',
      opacity: [0.08, 0.18, 0.08],
      scale: [0.95, 1.05, 0.98],
      screenOpacity: [0.14, 0.24, 0.14],
    };
  }

  if (vfxType === 'red-flicker' || mood === 'broken' || mood === 'regret') {
    return {
      color: '#E56B6F',
      opacity: [0.06, 0.18, 0.06],
      scale: [0.96, 1.1, 0.98],
      screenOpacity: [0.14, 0.3, 0.14],
    };
  }

  if (vfxType === 'green-pop' || mood === 'hopeful') {
    return {
      color: '#58B889',
      opacity: [0.05, 0.16, 0.05],
      scale: [0.96, 1.08, 0.98],
      screenOpacity: [0.12, 0.24, 0.12],
    };
  }

  if (vfxType === 'gold-shine' || mood === 'euphoric') {
    return {
      color: '#F2A93B',
      opacity: [0.05, 0.2, 0.05],
      scale: [0.96, 1.12, 0.98],
      screenOpacity: [0.16, 0.32, 0.16],
    };
  }

  if (mood === 'sleepy') {
    return {
      color: '#7C6CF2',
      opacity: [0.04, 0.1, 0.04],
      scale: [0.96, 1.04, 0.98],
      screenOpacity: [0.08, 0.18, 0.08],
    };
  }

  return {
    color: '#8EA3C0',
    opacity: 0.04,
    scale: 1,
    screenOpacity: 0.08,
  };
}

function getPreActionPose(preAction?: string | null) {
  switch (preAction) {
    case 'check-portfolio':
      return { bodyRotate: -1, headRotate: -2, phoneRotate: 8, bodyY: -1 };
    case 'buy-dip':
      return { bodyRotate: 1, headRotate: 1, phoneRotate: -6, bodyY: -2 };
    case 'go-sleep':
      return { bodyRotate: -1, headRotate: -3, phoneRotate: 0, bodyY: 2 };
    case 'touch-grass':
      return { bodyRotate: 1, headRotate: 2, phoneRotate: -2, bodyY: -1 };
    case 'open-telegram':
      return { bodyRotate: -2, headRotate: -2, phoneRotate: 6, bodyY: 0 };
    case 'listen-influencer':
      return { bodyRotate: 1, headRotate: 3, phoneRotate: -1, bodyY: -1 };
    case 'ape-coin':
      return { bodyRotate: 2, headRotate: 2, phoneRotate: -8, bodyY: -2 };
    case 'post-x':
      return { bodyRotate: 1, headRotate: 1, phoneRotate: -10, bodyY: -1 };
    case 'sell-peace':
      return { bodyRotate: -2, headRotate: -1, phoneRotate: 2, bodyY: 1 };
    default:
      return { bodyRotate: 0, headRotate: 0, phoneRotate: 0, bodyY: 0 };
  }
}

function getPostOutcomePose(mood: Mood, vfxType?: string) {
  if (vfxType === 'fake-gain-collapse') {
    return {
      bodyY: 4,
      scale: 0.995,
      bodyRotate: -2.5,
      headRotate: -3.5,
      phoneRotate: 8,
    };
  }

  switch (mood) {
    case 'regret':
      return {
        bodyY: 4,
        scale: 0.995,
        bodyRotate: -2,
        headRotate: -3,
        phoneRotate: 6,
      };
    case 'broken':
      return {
        bodyY: 5,
        scale: 0.992,
        bodyRotate: -3,
        headRotate: -4,
        phoneRotate: 8,
      };
    case 'hopeful':
      return {
        bodyY: -3,
        scale: 1.01,
        bodyRotate: 1,
        headRotate: 1.8,
        phoneRotate: -7,
      };
    case 'stressed':
      return {
        bodyY: 1,
        scale: 1,
        bodyRotate: -1.5,
        headRotate: -2.2,
        phoneRotate: 8,
      };
    case 'sleepy':
      return {
        bodyY: 3,
        scale: 0.998,
        bodyRotate: -1,
        headRotate: -3,
        phoneRotate: 0,
      };
    case 'confused':
      return {
        bodyY: 0,
        scale: 1,
        bodyRotate: 0.8,
        headRotate: 2.5,
        phoneRotate: -1,
      };
    case 'euphoric':
      return {
        bodyY: -5,
        scale: 1.02,
        bodyRotate: 1.5,
        headRotate: 2,
        phoneRotate: -10,
      };
    case 'neutral':
    default:
      return {
        bodyY: 0,
        scale: 1,
        bodyRotate: 0,
        headRotate: 0,
        phoneRotate: getPhoneTilt(mood),
      };
  }
}