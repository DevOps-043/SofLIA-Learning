'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface VoiceGuideAvatarProps {
  disableHeavy: boolean;
  isMobile: boolean;
  isSpeaking: boolean;
}

const SPEAKING_SHADOWS = [
  '0 0 30px color-mix(in srgb, var(--color-primary) 60%, transparent)',
  '0 0 80px color-mix(in srgb, var(--color-accent) 90%, transparent)',
  '0 0 30px color-mix(in srgb, var(--color-primary) 60%, transparent)',
];

export function VoiceGuideAvatar({
  disableHeavy,
  isMobile,
  isSpeaking,
}: VoiceGuideAvatarProps) {
  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-1.5 sm:mb-2 md:mb-3">
      <motion.div
        className="absolute inset-8 sm:inset-10 md:inset-12 rounded-full bg-gradient-to-br from-primary via-accent to-primary p-1 overflow-hidden"
        animate={{
          scale: isSpeaking ? [1, 1.08, 1] : 1,
          boxShadow: isSpeaking
            ? SPEAKING_SHADOWS
            : '0 0 50px color-mix(in srgb, var(--color-accent) 70%, transparent)',
        }}
        transition={{
          scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden bg-white/10 backdrop-blur-sm">
          <Image
            src="/lia-avatar.webp"
            alt="LIA"
            fill
            sizes="256px"
            className="object-cover"
            priority
          />
        </div>
      </motion.div>

      {!disableHeavy && [...Array(8)].map((_, i) => {
        const radius = isMobile ? 50 : 70;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
            style={{ left: '50%', top: '50%' }}
            animate={{
              x: [0, Math.cos(i * 45 * Math.PI / 180) * radius],
              y: [0, Math.sin(i * 45 * Math.PI / 180) * radius],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: 'easeOut' }}
          />
        );
      })}

      {isSpeaking ? (
        <motion.div
          className="absolute inset-6 sm:inset-8 rounded-full border-2 border-white/50"
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}
    </div>
  );
}
