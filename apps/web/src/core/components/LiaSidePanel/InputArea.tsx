'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Loader2 } from 'lucide-react';
import { buildVoiceInputColors } from '../../theme/voice-input-colors';
import { LiaThemeColors } from './types';

const MAX_TEXTAREA_HEIGHT = 120; // ~5 rows

const BAR_VARIANTS = [0.2, 1, 0.4, 0.7, 0.3, 0.9, 0.5];

function VoiceWaveform({ color, barCount = 5, height = 16 }: { color: string; barCount?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: `${height}px` }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: BAR_VARIANTS }}
          transition={{
            duration: 1.1 + i * 0.07,
            repeat: Infinity,
            delay: i * 0.13,
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
  isLiveVoiceActive: boolean;
  isLiveVoiceConnecting: boolean;
  isProcessingDictation: boolean;
  interimTranscript: string;
  finalTranscript: string;
  stopDictation: () => void;
  toggleDictation: () => void;
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
  isLiveVoiceActive,
  isLiveVoiceConnecting,
  isProcessingDictation,
  interimTranscript,
  finalTranscript,
  stopDictation,
  toggleDictation,
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
  const isVoiceInputActive = isDictating || isLiveVoiceActive;
  const isVoiceInputProcessing = isProcessingDictation || isLiveVoiceConnecting;
  const shouldShowMicButton = isVoiceEnabled || isDictationEnabled;
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

  // Auto-resize textarea: expands upward (pushes messages up) up to MAX_TEXTAREA_HEIGHT
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    if (composedInputValue) {
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }
  }, [composedInputValue]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const disabledBg = isLightTheme ? 'var(--color-gray-200)' : 'var(--color-gray-800)';

  // El micrófono usa el color de la organización (acento de plataforma si no hay
  // branding) en lugar del gris neutro, que resultaba invisible para el usuario.
  const voiceColors = buildVoiceInputColors(themeColors.accentColor);

  const buttonBackgroundColor =
    buttonMode === 'stop'
      ? 'var(--color-error)'
      : buttonMode === 'processing'
      ? disabledBg
      : buttonMode === 'send'
      ? canSendMessage
        ? themeColors.accentColor
        : disabledBg
      : voiceColors.background;

  const buttonTitle =
    buttonMode === 'stop'
      ? isVoiceEnabled
        ? 'Detener voz en vivo'
        : 'Detener dictado'
      : buttonMode === 'send'
      ? t('lia.chat.send')
      : isVoiceEnabled
      ? 'Iniciar voz en vivo'
      : 'Iniciar dictado';

  return (
    <div
      style={{
        padding: '8px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
        borderTop: `1px solid ${themeColors.borderColor}`,
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        backgroundColor: themeColors.panelBg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          backgroundColor: themeColors.inputBg,
          borderRadius: '18px',
          padding: '6px 10px',
          border: `1px solid ${themeColors.inputBorder}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {isDictating && !composedInputValue && (
            <div style={{ paddingBottom: '4px' }}>
              <VoiceWaveform color={themeColors.accentColor} barCount={6} height={16} />
            </div>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            value={composedInputValue}
            disabled={isInputBlocked}
            aria-disabled={isInputBlocked}
            onChange={(e) => {
              if (!isDictating && !isInputBlocked) {
                setInputValue(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
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
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: themeColors.textPrimary,
              fontSize: '14px',
              lineHeight: '1.5',
              minWidth: 0,
              resize: 'none',
              overflow: 'hidden',
              cursor: isInputBlocked ? 'not-allowed' : 'text',
              opacity: isInputBlocked ? 0.6 : 1,
              // Single-line height matches the button so the bottom edge aligns
              minHeight: '22px',
              maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
              padding: '2px 0',
              overflowY: composedInputValue.split('\n').length > 5 ||
                (inputRef.current?.scrollHeight ?? 0) >= MAX_TEXTAREA_HEIGHT
                  ? 'auto'
                  : 'hidden',
            }}
          />
        </div>

        <button
          onClick={handleUnifiedButtonClick}
          disabled={isButtonDisabled}
          title={buttonTitle}
          aria-label={buttonTitle}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: buttonBackgroundColor,
            border:
              buttonMode === 'mic'
                ? `1px solid ${voiceColors.border}`
                : buttonMode === 'stop'
                ? '1px solid var(--color-error)'
                : 'none',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: buttonMode === 'processing' ? 0.6 : 1,
            // Align button to bottom so it stays at baseline when textarea grows
            alignSelf: 'flex-end',
            marginBottom: '1px',
          }}
        >
          {buttonMode === 'processing' ? (
            <Loader2
              style={{ width: '14px', height: '14px', color: themeColors.textSecondary }}
              className="animate-spin"
            />
          ) : buttonMode === 'stop' ? (
            <VoiceWaveform color="#ffffff" barCount={4} height={12} />
          ) : buttonMode === 'send' ? (
            <Send
              style={{
                width: '14px',
                height: '14px',
                color: canSendMessage
                  ? '#ffffff'
                  : themeColors.textSecondary,
              }}
            />
          ) : (
            <Mic
              style={{ width: '15px', height: '15px', color: voiceColors.icon }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
