'use client';

import React from 'react';
import { Send, Mic, MicOff, Loader2, Paperclip, X } from 'lucide-react';
import { LiaThemeColors } from './types';
import type { LiaImageAttachment } from '../../reporting/report-problem.contract';

interface InputAreaProps {
  t: (key: string) => string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  inputValue: string;
  setInputValue: (v: string) => void;
  selectedAttachment: LiaImageAttachment | null;
  attachmentError: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  attachmentInputRef: React.RefObject<HTMLInputElement>;
  isDictating: boolean;
  isDictationEnabled: boolean;
  isProcessingDictation: boolean;
  interimTranscript: string;
  finalTranscript: string;
  stopDictation: () => void;
  toggleDictation: () => void;
  handleAttachmentSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAttachment: () => void;
  handleAttachmentButtonClick: () => void;
  handleSendMessage: () => void;
  isLoading: boolean;
}

export function InputArea({
  t,
  themeColors,
  isLightTheme,
  inputValue,
  setInputValue,
  selectedAttachment,
  attachmentError,
  inputRef,
  attachmentInputRef,
  isDictating,
  isDictationEnabled,
  isProcessingDictation,
  interimTranscript,
  finalTranscript,
  stopDictation,
  toggleDictation,
  handleAttachmentSelect,
  handleRemoveAttachment,
  handleAttachmentButtonClick,
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
    Boolean(inputValue.trim() || selectedAttachment) && !isLoading;

  return (
    <div
      style={{
        padding: '12px 16px 16px',
        borderTop: `1px solid ${themeColors.borderColor}`,
      }}
    >
      <input
        ref={attachmentInputRef}
        type="file"
        accept="image/*"
        onChange={handleAttachmentSelect}
        style={{ display: 'none' }}
      />

      {selectedAttachment ? (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            borderRadius: '16px',
            border: `1px solid ${themeColors.borderColor}`,
            backgroundColor: themeColors.inputBg,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <img
            src={selectedAttachment.dataUrl}
            alt={selectedAttachment.fileName}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                color: themeColors.textPrimary,
                fontSize: '13px',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedAttachment.fileName}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                color: themeColors.textSecondary,
                fontSize: '11px',
              }}
            >
              Evidencia visual lista para enviar
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveAttachment}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              color: themeColors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      ) : null}

      {attachmentError ? (
        <div
          style={{
            marginBottom: '12px',
            padding: '8px 12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#EF4444',
            fontSize: '12px',
          }}
        >
          {attachmentError}
        </div>
      ) : null}

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
                : selectedAttachment
                ? 'Describe la imagen o el problema...'
                : t('lia.chat.inputPlaceholder')
            }
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

        <button
          type="button"
          onClick={handleAttachmentButtonClick}
          title="Adjuntar imagen"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: selectedAttachment
              ? `${themeColors.accentColor}20`
              : 'transparent',
            border: `1px solid ${
              selectedAttachment ? themeColors.accentColor : themeColors.inputBorder
            }`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          <Paperclip
            style={{
              width: '16px',
              height: '16px',
              color: selectedAttachment
                ? themeColors.accentColor
                : themeColors.textSecondary,
            }}
          />
        </button>

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
                ? isLightTheme
                  ? '#CBD5E1'
                  : '#374151'
                : 'transparent',
              border: `1px solid ${
                isDictating ? '#EF4444' : themeColors.inputBorder
              }`,
              cursor: isProcessingDictation ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: isProcessingDictation ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessingDictation && !isDictating) {
                e.currentTarget.style.backgroundColor = isLightTheme
                  ? '#E2E8F0'
                  : '#1e2a35';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDictating) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isProcessingDictation ? (
              <Loader2
                style={{
                  width: '16px',
                  height: '16px',
                  color: themeColors.textSecondary,
                }}
                className="animate-spin"
              />
            ) : isDictating ? (
              <MicOff
                style={{ width: '16px', height: '16px', color: '#FFFFFF' }}
              />
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
              ? '#CBD5E1'
              : '#374151',
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
                ? '#FFFFFF'
                : isLightTheme
                ? '#6B7280'
                : '#9CA3AF',
            }}
          />
        </button>
      </div>
    </div>
  );
}
