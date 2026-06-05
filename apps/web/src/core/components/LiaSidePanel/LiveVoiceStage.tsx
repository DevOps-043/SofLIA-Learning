'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MicOff } from 'lucide-react';
import type { LiaThemeColors } from './types';

interface LiveVoiceStageProps {
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  isConnecting: boolean;
  isAssistantSpeaking: boolean;
  onStop: () => void;
}

const RING_SIZES = [168, 228, 292];

export function LiveVoiceStage({
  themeColors,
  isLightTheme,
  isConnecting,
  isAssistantSpeaking,
  onStop,
}: LiveVoiceStageProps) {
  const ringDuration = isAssistantSpeaking ? 1.8 : 3.2;
  const ringOpacity = isAssistantSpeaking ? [0.12, 0.34, 0.12] : [0.05, 0.16, 0.05];
  const ringScale = isAssistantSpeaking ? [0.9, 1.18, 0.9] : [0.96, 1.05, 0.96];

  return (
    <section
      aria-label={isConnecting ? 'Conectando voz en vivo de SofLIA' : 'Voz en vivo de SofLIA activa'}
      data-testid="lia-live-voice-stage"
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '32px 24px calc(32px + env(safe-area-inset-bottom, 0px))',
        background: `radial-gradient(circle at center, color-mix(in srgb, ${themeColors.accentColor} 16%, transparent) 0%, transparent 48%)`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          width: 'min(76vw, 320px)',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {RING_SIZES.map((size, index) => (
          <motion.div
            key={size}
            animate={{
              opacity: ringOpacity,
              scale: ringScale,
            }}
            transition={{
              duration: ringDuration + index * 0.35,
              repeat: Infinity,
              delay: index * 0.18,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: `${size}px`,
              height: `${size}px`,
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '50%',
              border: `1px solid ${themeColors.accentColor}`,
              boxShadow: `0 0 ${isAssistantSpeaking ? 36 : 18}px color-mix(in srgb, ${themeColors.accentColor} 36%, transparent)`,
            }}
          />
        ))}

        <motion.img
          src="/lia-avatar.webp"
          alt="SofLIA"
          animate={{
            scale: isAssistantSpeaking ? [1, 1.04, 1] : 1,
            boxShadow: isAssistantSpeaking
              ? [
                  `0 0 0 color-mix(in srgb, ${themeColors.accentColor} 0%, transparent)`,
                  `0 0 42px color-mix(in srgb, ${themeColors.accentColor} 46%, transparent)`,
                  `0 0 0 color-mix(in srgb, ${themeColors.accentColor} 0%, transparent)`,
                ]
              : `0 0 24px color-mix(in srgb, ${themeColors.accentColor} 22%, transparent)`,
          }}
          transition={{
            duration: isAssistantSpeaking ? 1.2 : 0.3,
            repeat: isAssistantSpeaking ? Infinity : 0,
            ease: 'easeInOut',
          }}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: `3px solid ${themeColors.accentColor}`,
            position: 'relative',
            zIndex: 1,
          }}
        />
      </div>

      <button
        type="button"
        onClick={onStop}
        aria-label="Detener voz en vivo"
        title="Detener voz en vivo"
        style={{
          position: 'absolute',
          bottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: `1px solid ${themeColors.inputBorder}`,
          backgroundColor: isLightTheme ? 'var(--color-bg-light)' : themeColors.inputBg,
          color: themeColors.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isLightTheme
            ? '0 12px 24px color-mix(in srgb, var(--color-gray-900) 12%, transparent)'
            : '0 12px 24px color-mix(in srgb, var(--color-bg-dark) 28%, transparent)',
        }}
      >
        <MicOff aria-hidden="true" style={{ width: '20px', height: '20px' }} />
      </button>
    </section>
  );
}
