import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Send, Square } from 'lucide-react';

import { COURSE_LIA_COLORS } from '../constants';
import type { CourseLiaThemeColors, PrimaryActionMode } from '../types';

import { VoiceWaveformBars } from './VoiceWaveformBars';

interface PrimaryActionButtonProps {
  disabled: boolean;
  isLightTheme: boolean;
  isListening: boolean;
  label: string;
  mode: PrimaryActionMode;
  onClick: () => void;
  themeColors: CourseLiaThemeColors;
}

export function PrimaryActionButton({
  disabled,
  isLightTheme,
  isListening,
  label,
  mode,
  onClick,
  themeColors,
}: PrimaryActionButtonProps) {
  const backgroundColor = mode === 'stop'
    ? isLightTheme ? '#DC2626' : '#EF4444'
    : mode === 'send'
      ? themeColors.primaryAction
      : isListening
        ? 'rgba(16,185,129,0.16)'
        : isLightTheme ? '#CBD5E1' : '#374151';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={label}
      aria-label={label}
      style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 180ms ease' }}
    >
      <AnimatePresence mode="wait">
        {mode === 'stop' ? (
          <motion.span key="stop" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Square style={{ width: '15px', height: '15px', color: COURSE_LIA_COLORS.white, fill: COURSE_LIA_COLORS.white }} />
          </motion.span>
        ) : mode === 'send' ? (
          <motion.span key="send" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Send style={{ width: '16px', height: '16px', color: isLightTheme ? COURSE_LIA_COLORS.white : COURSE_LIA_COLORS.primary }} />
          </motion.span>
        ) : isListening ? (
          <motion.span key="listening" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
            <VoiceWaveformBars color={COURSE_LIA_COLORS.success} count={4} size={14} />
          </motion.span>
        ) : (
          <motion.span key="mic" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
            <Mic style={{ width: '16px', height: '16px', color: isLightTheme ? '#6B7280' : '#9CA3AF' }} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
