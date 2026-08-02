'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AudioLines, Loader2, Mic, Send } from 'lucide-react';
import { buildVoiceInputColors } from '../../theme/voice-input-colors';
import { LiaThemeColors } from './types';
import styles from './LiaSidePanel.module.css';

const MAX_TEXTAREA_HEIGHT = 120;
const BAR_VARIANTS = [0.2, 1, 0.4, 0.7, 0.3, 0.9, 0.5];

function VoiceWaveform({
  color,
  barCount = 5,
  height = 16,
}: {
  color: string;
  barCount?: number;
  height?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        height: `${height}px`,
      }}
    >
      {Array.from({ length: barCount }).map((_, index) => (
        <motion.span
          key={index}
          animate={{ scaleY: BAR_VARIANTS }}
          transition={{
            duration: 1.1 + index * 0.07,
            repeat: Infinity,
            delay: index * 0.13,
            ease: 'easeInOut',
          }}
          style={{
            width: '3px',
            height: '100%',
            borderRadius: '3px',
            backgroundColor: color,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}

interface InputAreaProps {
  t: (key: string) => string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  isDictating: boolean;
  isDictationEnabled: boolean;
  isVoiceEnabled: boolean;
  isLiveVoiceConnecting: boolean;
  isProcessingDictation: boolean;
  interimTranscript: string;
  finalTranscript: string;
  stopDictation: () => void;
  toggleDictation: () => void;
  toggleLiveVoice: () => void;
  handleSendMessage: () => void;
  /** SofLIA está generando o aún escribiendo en pantalla: bloquea la entrada. */
  isResponding: boolean;
}

export function InputArea({
  t,
  themeColors,
  isLightTheme,
  inputValue,
  setInputValue,
  inputRef,
  isDictating,
  isDictationEnabled,
  isVoiceEnabled,
  isLiveVoiceConnecting,
  isProcessingDictation,
  interimTranscript,
  finalTranscript,
  stopDictation,
  toggleDictation,
  toggleLiveVoice,
  handleSendMessage,
  isResponding,
}: InputAreaProps) {
  const composedInputValue =
    inputValue +
    (isDictating
      ? (inputValue ? ' ' : '') +
        finalTranscript +
        (finalTranscript && interimTranscript ? ' ' : '') +
        interimTranscript
      : '');

  const hasText = Boolean(inputValue.trim());
  const canSendMessage = hasText && !isResponding;
  const isVoiceInputActive = isDictating;
  const isVoiceInputProcessing = isProcessingDictation;
  const shouldShowMicButton = isDictationEnabled;
  const isInputBlocked = isResponding && !isDictating;

  const buttonMode: 'processing' | 'stop' | 'send' | 'mic' = isVoiceInputProcessing
    ? 'processing'
    : isVoiceInputActive
    ? 'stop'
    : hasText || !shouldShowMicButton
    ? 'send'
    : 'mic';

  const isButtonDisabled =
    buttonMode === 'processing' ||
    (buttonMode === 'send' && !canSendMessage) ||
    (buttonMode === 'mic' && isInputBlocked);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;

    element.style.height = 'auto';
    if (composedInputValue) {
      element.style.height = `${Math.min(
        element.scrollHeight,
        MAX_TEXTAREA_HEIGHT,
      )}px`;
    }
  }, [composedInputValue, inputRef]);

  const handleUnifiedButtonClick = () => {
    if (buttonMode === 'stop') {
      stopDictation();
      return;
    }

    if (buttonMode === 'send') {
      if (isDictating) stopDictation();
      handleSendMessage();
      return;
    }

    if (buttonMode === 'mic') {
      toggleDictation();
    }
  };

  const disabledBackground = isLightTheme
    ? 'var(--color-gray-200)'
    : 'var(--color-gray-800)';
  const voiceColors = buildVoiceInputColors(themeColors.accentColor);

  const buttonBackground =
    buttonMode === 'stop'
      ? 'var(--color-error)'
      : buttonMode === 'processing'
      ? disabledBackground
      : buttonMode === 'send'
      ? canSendMessage
        ? themeColors.accentColor
        : disabledBackground
      : voiceColors.background;

  const buttonTitle =
    buttonMode === 'stop'
      ? 'Detener dictado'
      : buttonMode === 'send'
      ? t('lia.chat.send')
      : 'Iniciar dictado';

  const shouldScrollTextarea =
    composedInputValue.split('\n').length > 5 ||
    (inputRef.current?.scrollHeight ?? 0) >= MAX_TEXTAREA_HEIGHT;

  return (
    <div className={styles.composerWrap}>
      <div className={styles.composer}>
        <div className={styles.textareaWrap}>
          {isDictating && !composedInputValue && (
            <div className={styles.voiceWave}>
              <VoiceWaveform
                color={themeColors.accentColor}
                barCount={6}
                height={16}
              />
            </div>
          )}

          <textarea
            ref={inputRef}
            rows={1}
            value={composedInputValue}
            disabled={isInputBlocked}
            aria-disabled={isInputBlocked}
            className={styles.textarea}
            onChange={(event) => {
              if (!isDictating && !isInputBlocked) {
                setInputValue(event.target.value);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (isInputBlocked) return;
                if (isDictating) stopDictation();
                handleSendMessage();
              }
            }}
            placeholder={
              isInputBlocked
                ? t('lia.chat.responding')
                : isDictating
                ? 'Escuchando...'
                : t('lia.chat.inputPlaceholder')
            }
            style={{
              maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
              overflowY: shouldScrollTextarea ? 'auto' : 'hidden',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleUnifiedButtonClick}
          disabled={isButtonDisabled}
          title={buttonTitle}
          aria-label={buttonTitle}
          className={styles.submitButton}
          style={{
            backgroundColor: buttonBackground,
            border:
              buttonMode === 'mic'
                ? `1px solid ${voiceColors.border}`
                : buttonMode === 'stop'
                ? '1px solid var(--color-error)'
                : '1px solid transparent',
            color:
              buttonMode === 'mic'
                ? voiceColors.icon
                : buttonMode === 'send' && !canSendMessage
                ? themeColors.textSecondary
                : 'var(--color-bg-light)',
            opacity: buttonMode === 'processing' ? 0.6 : 1,
          }}
        >
          {buttonMode === 'processing' ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : buttonMode === 'stop' ? (
            <VoiceWaveform
              color="var(--color-bg-light)"
              barCount={4}
              height={12}
            />
          ) : buttonMode === 'send' ? (
            <Send size={14} aria-hidden="true" />
          ) : (
            <Mic size={15} aria-hidden="true" />
          )}
        </button>

        {isVoiceEnabled && (
          <button
            type="button"
            onClick={toggleLiveVoice}
            disabled={isResponding || isLiveVoiceConnecting}
            title="Iniciar conversación por voz"
            aria-label="Iniciar conversación por voz"
            className={styles.submitButton}
            style={{
              backgroundColor: voiceColors.background,
              border: `1px solid ${voiceColors.border}`,
              color: voiceColors.icon,
              opacity: isResponding || isLiveVoiceConnecting ? 0.55 : 1,
            }}
          >
            {isLiveVoiceConnecting ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <AudioLines size={15} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
