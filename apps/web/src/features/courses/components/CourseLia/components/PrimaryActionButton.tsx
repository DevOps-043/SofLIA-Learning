import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Send, Square } from 'lucide-react';

import { buildVoiceInputColors } from '@/core/theme/voice-input-colors';

import { COURSE_LIA_COLORS } from '../constants';
import styles from '../CourseLiaPanel.module.css';
import type { CourseLiaThemeColors, PrimaryActionMode } from '../types';

import { VoiceWaveformBars } from './VoiceWaveformBars';

interface PrimaryActionButtonProps {
  disabled: boolean;
  isListening: boolean;
  label: string;
  mode: PrimaryActionMode;
  onClick: () => void;
  themeColors: CourseLiaThemeColors;
}

export function PrimaryActionButton({
  disabled,
  isListening,
  label,
  mode,
  onClick,
  themeColors,
}: PrimaryActionButtonProps) {
  // El micrófono se pinta con el color de la organización (o el acento de la
  // plataforma si no hay branding) para que sea visible: en gris pasaba
  // desapercibido y los usuarios no descubrían el dictado.
  const voiceColors = buildVoiceInputColors(themeColors.accentColor);
  const modeClassName = mode === 'stop'
    ? styles.primaryActionStop
    : mode === 'voice'
      ? styles.primaryActionVoice
      : '';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={label}
      aria-label={label}
      className={`${styles.primaryAction} ${modeClassName}`}
    >
      <AnimatePresence mode="wait">
        {mode === 'stop' ? (
          <motion.span key="stop" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Square style={{ width: '15px', height: '15px', color: COURSE_LIA_COLORS.white, fill: COURSE_LIA_COLORS.white }} />
          </motion.span>
        ) : mode === 'send' ? (
          <motion.span key="send" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Send style={{ width: '16px', height: '16px', color: COURSE_LIA_COLORS.white }} />
          </motion.span>
        ) : isListening ? (
          <motion.span key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
            <VoiceWaveformBars color={COURSE_LIA_COLORS.success} count={4} size={14} />
          </motion.span>
        ) : (
          <motion.span key="mic" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Mic style={{ width: '16px', height: '16px', color: voiceColors.icon }} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
