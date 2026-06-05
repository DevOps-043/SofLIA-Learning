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
  isLoading: boolean;
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
  isLoading,
}: InputAreaProps) {
  const composedInputValue =
    inputValue +
    (isDictating
      ? (inputValue ? ' ' : '') +
        finalTranscript +
        (finalTranscript && interimTranscript ? ' ' : '') +
        interimTranscript
      : '');

  const canSendMessage =
    Boolean(inputValue.trim()) && !isLoading;
  const isVoiceInputActive = isDictating || isLiveVoiceActive;
  const isVoiceInputProcessing = isProcessingDictation || isLiveVoiceConnecting;
  const shouldShowMicButton = isVoiceEnabled || isDictationEnabled;

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
            onChange={(e) => {
              if (!isDictating) {
                setInputValue(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isDictating) {
                  stopDictation();
                }
                handleSendMessage();
              }
            }}
            placeholder={
              isDictating
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
            }}
          />
        </div>

        {shouldShowMicButton && (
          <button
            onClick={toggleDictation}
            disabled={isVoiceInputProcessing}
            title={
              isVoiceEnabled
                ? isVoiceInputActive
                  ? 'Detener voz en vivo'
                  : 'Iniciar voz en vivo'
                : isDictating
                ? 'Detener dictado'
                : 'Iniciar dictado'
            }
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isVoiceInputActive
                ? 'var(--color-error)'
                : isVoiceInputProcessing
                ? isLightTheme
                  ? 'var(--color-gray-300)'
                  : 'var(--color-legacy-374151)'
                : 'transparent',
              border: `1px solid ${
                isVoiceInputActive ? 'var(--color-error)' : themeColors.inputBorder
              }`,
              cursor: isVoiceInputProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: isVoiceInputProcessing ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isVoiceInputProcessing && !isVoiceInputActive) {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? 'var(--color-gray-200)'
                  : 'var(--color-legacy-1e2a35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isVoiceInputActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isVoiceInputProcessing ? (
              <Loader2
                style={{
                  width: '16px',
                  height: '16px',
                  color: themeColors.textSecondary,
                }}
                className="animate-spin"
              />
            ) : isVoiceInputActive ? (
              <VoiceWaveform color="var(--color-bg-light)" barCount={4} height={14} />
            ) : (
              <Mic
                style={{
                  width: '16px',
                  height: '16px',
                  color: themeColors.textSecondary,
                }}
              />
            )}
          </button>
        )}

        <button
          onClick={handleSendMessage}
          disabled={!canSendMessage}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: canSendMessage
              ? themeColors.accentColor
              : isLightTheme
              ? 'var(--color-gray-300)'
              : 'var(--color-legacy-374151)',
            border: 'none',
            cursor: canSendMessage ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
        >
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
        </button>
      </div>
    </div>
  );
}
