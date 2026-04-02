'use client';

import React from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { LiaThemeColors } from './types';

interface InputAreaProps {
  t: (key: string) => string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isDictating: boolean;
  isDictationEnabled: boolean;
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
  isProcessingDictation,
  interimTranscript,
  finalTranscript,
  stopDictation,
  toggleDictation,
  handleSendMessage,
  isLoading,
}: InputAreaProps) {
  return (
    <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${themeColors.borderColor}` }}>
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
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={
              inputValue +
              (isDictating
                ? (inputValue ? ' ' : '') +
                  finalTranscript +
                  (finalTranscript && interimTranscript ? ' ' : '') +
                  interimTranscript
                : '')
            }
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
            placeholder={isDictating ? 'Escuchando...' : t('lia.chat.inputPlaceholder')}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: themeColors.textPrimary,
              fontSize: '14px',
            }}
          />
          {isDictating && interimTranscript && (
            <div
              style={{
                position: 'absolute',
                bottom: '-18px',
                left: 0,
                fontSize: '11px',
                color: themeColors.accentColor,
                fontStyle: 'italic',
                pointerEvents: 'none',
                opacity: 0.7,
              }}
            >
              {interimTranscript}
            </div>
          )}
        </div>

        {/* Botón de dictado */}
        {isDictationEnabled && (
          <button
            onClick={toggleDictation}
            disabled={isProcessingDictation}
            title={isDictating ? 'Detener dictado' : 'Iniciar dictado'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isDictating
                ? '#EF4444'
                : isProcessingDictation
                ? isLightTheme ? '#CBD5E1' : '#374151'
                : 'transparent',
              border: `1px solid ${isDictating ? '#EF4444' : themeColors.inputBorder}`,
              cursor: isProcessingDictation ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: isProcessingDictation ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessingDictation && !isDictating) {
                e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDictating) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isProcessingDictation ? (
              <Loader2 style={{ width: '16px', height: '16px', color: themeColors.textSecondary }} className="animate-spin" />
            ) : isDictating ? (
              <MicOff style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
            ) : (
              <Mic style={{ width: '16px', height: '16px', color: themeColors.textSecondary }} />
            )}
          </button>
        )}

        {/* Botón enviar */}
        <button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor:
              inputValue.trim() && !isLoading
                ? themeColors.accentColor
                : isLightTheme ? '#CBD5E1' : '#374151',
            border: 'none',
            cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
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
              color:
                inputValue.trim() && !isLoading
                  ? '#FFFFFF'
                  : isLightTheme ? '#6B7280' : '#9CA3AF',
            }}
          />
        </button>
      </div>
    </div>
  );
}
