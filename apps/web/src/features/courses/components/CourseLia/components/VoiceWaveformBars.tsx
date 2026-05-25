import { motion } from 'framer-motion';

import { VOICE_BAR_SCALES } from '../constants';

interface VoiceWaveformBarsProps {
  color: string;
  count?: number;
  size?: number;
}

export function VoiceWaveformBars({
  color,
  count = 4,
  size = 14,
}: VoiceWaveformBarsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px', height: `${size}px` }}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          animate={{ scaleY: VOICE_BAR_SCALES }}
          transition={{
            duration: 1.1 + index * 0.09,
            repeat: Infinity,
            delay: index * 0.13,
            ease: 'easeInOut',
          }}
          style={{
            width: '3px',
            height: '100%',
            borderRadius: '2px',
            backgroundColor: color,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}
