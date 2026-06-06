'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Loader2 } from 'lucide-react';
import { LiaThemeColors } from './types';

const BAR_VARIANTS = [0.2, 1, 0.4, 0.7, 0.3, 0.9, 0.5];

function VoiceWaveform({ color, barCount = 5, height = 18 }: { color: string; barCount?: number; height?: number }) {
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
  inputRef: React.RefObject<HTMLInputElement>;
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
  // Mientras SofLIA responde se bloquea la caja de texto (no el dictado en curso).
  const isInputBlocked = isResponding && !isDictating;

  // Boton unificado estilo WhatsApp: un solo control que cambia de funcion
  // segun el estado. El orden de prioridad importa (processing > stop > send > mic).
  const buttonMode: 'processing' | 'stop' | 'send' | 'mic' = isVoiceInputProcessing
    ? 'processing'
    : isVoiceInputActive
    ? 'stop'
    : hasText || !shouldShowMicButton
    ? 'send'
    : 'mic';

  // Mientras SofLIA responde se bloquea iniciar voz o enviar, pero NUNCA
  // detener una sesion en curso (el usuario siempre puede cortar).
  const isButtonDisabled =
    buttonMode === 'processing' ||
    (buttonMode === 'send' && !canSendMessage) ||
    (buttonMode === 'mic' && isInputBlocked);

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

  const buttonBackgroundColor =
    buttonMode === 'stop'
      ? 'var(--color-error)'
      : buttonMode === 'processing'
      ? isLightTheme
        ? 'var(--color-gray-300)'
        : 'var(--color-legacy-374151)'
      : buttonMode === 'send'
      ? canSendMessage
        ? themeColors.accentColor
        : isLightTheme
        ? 'var(--color-gray-300)'
        : 'var(--color-legacy-374151)'
      : 'transparent'; // mic

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
        padding: '12px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
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
          alignItems: 'center',
          gap: '12px',
          backgroundColor: themeColors.inputBg,
          borderRadius: '24px',
          padding: '10px 16px',
          border: `1px solid ${themeColors.inputBorder}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDictating && !composedInputValue && (
            <VoiceWaveform color={themeColors.accentColor} barCount={6} height={18} />
          )}
          <input
            ref={inputRef}
            type="text"
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
                if (isInputBlocked) {
                  return;
                }
                if (isDictating) {
                  stopDictation();
                }
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
              fontSize: '16px',
              minWidth: 0,
              cursor: isInputBlocked ? 'not-allowed' : 'text',
              opacity: isInputBlocked ? 0.6 : 1,
            }}
          />
        </div>

        {/* Boton unico estilo WhatsApp: micro cuando el campo esta vacio,
            enviar cuando hay texto, y detener mientras la voz esta activa. */}
        <button
          onClick={handleUnifiedButtonClick}
          disabled={isButtonDisabled}
          title={buttonTitle}
          aria-label={buttonTitle}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: buttonBackgroundColor,
            border:
              buttonMode === 'mic'
                ? `1px solid ${themeColors.inputBorder}`
                : buttonMode === 'stop'
                ? '1px solid var(--color-error)'
                : 'none',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            opacity: buttonMode === 'processing' ? 0.6 : 1,
          }}
        >
          {buttonMode === 'processing' ? (
            <Loader2
              style={{ width: '16px', height: '16px', color: themeColors.textSecondary }}
              className="animate-spin"
            />
          ) : buttonMode === 'stop' ? (
            <VoiceWaveform color="var(--color-bg-light)" barCount={4} height={14} />
          ) : buttonMode === 'send' ? (
            <Send
              style={{
                width: '16px',
                height: '16px',
                color: canSendMessage
                  ? 'var(--color-bg-light)'
                  : isLightTheme
                  ? 'var(--color-legacy-6b7280)'
                  : 'var(--color-legacy-9ca3af)',
              }}
            />
          ) : (
            <Mic
              style={{ width: '18px', height: '18px', color: themeColors.textSecondary }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
