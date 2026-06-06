'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, MoreVertical, Settings, Trash2, Volume2, VolumeX } from 'lucide-react';
import { LiaThemeColors, LiaMessage } from './types';

interface PanelHeaderProps {
  t: (key: string) => string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  toggleVoiceEnabled: () => void;
  isVoiceTogglePending: boolean;
  showHistory: boolean;
  closeHistory: () => void;
  setShowHistory: (v: boolean) => void;
  isOptionsMenuOpen: boolean;
  setIsOptionsMenuOpen: (v: boolean) => void;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  setIsPersonalizationOpen: (v: boolean) => void;
  clearHistory: () => void;
  messages: LiaMessage[];
  closePanel: () => void;
  setIsAvatarExpanded: (v: boolean) => void;
}

export function PanelHeader({
  t,
  themeColors,
  isLightTheme,
  isSpeaking,
  isVoiceEnabled,
  toggleVoiceEnabled,
  isVoiceTogglePending,
  showHistory,
  closeHistory,
  setShowHistory,
  isOptionsMenuOpen,
  setIsOptionsMenuOpen,
  optionsMenuRef,
  setIsPersonalizationOpen,
  clearHistory,
  messages,
  closePanel,
  setIsAvatarExpanded,
}: PanelHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'calc(20px + env(safe-area-inset-top, 0px)) 24px 20px',
        borderBottom: `1px solid ${themeColors.borderColor}`,
        backgroundColor: themeColors.headerBg,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar de LIA */}
        <div style={{ position: 'relative' }}>
          {/* Anillo pulsante mientras SofLIA habla (modo texto a voz activo) */}
          {isSpeaking && (
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '50%',
                border: `2px solid ${themeColors.accentColor}`,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}
          <motion.img
            layoutId="lia-avatar-header"
            src="/lia-avatar.webp"
            alt="SofLIA"
            onClick={() => setIsAvatarExpanded(true)}
            whileHover={{ scale: 1.05 }}
            animate={
              isSpeaking
                ? {
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      `0 0 0 color-mix(in srgb, ${themeColors.accentColor} 0%, transparent)`,
                      `0 0 18px color-mix(in srgb, ${themeColors.accentColor} 55%, transparent)`,
                      `0 0 0 color-mix(in srgb, ${themeColors.accentColor} 0%, transparent)`,
                    ],
                  }
                : { scale: 1, boxShadow: `0 0 0 color-mix(in srgb, ${themeColors.accentColor} 0%, transparent)` }
            }
            transition={{ duration: 1.2, repeat: isSpeaking ? Infinity : 0, ease: 'easeInOut' }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${themeColors.accentColor}`,
              cursor: 'zoom-in',
              position: 'relative',
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '14px',
              height: '14px',
              backgroundColor: 'var(--color-legacy-22c55e)',
              borderRadius: '50%',
              border: `2px solid ${themeColors.panelBg}`,
              zIndex: 2,
            }}
          />
        </div>

        <div>
          <h2 style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
            {t('lia.header.title')}
          </h2>
          <p
            aria-live="polite"
            style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}
          >
            {isSpeaking ? t('lia.header.speaking') : t('lia.header.subtitle')}
          </p>
        </div>
      </div>

      {/* Acciones: voz, historial, opciones, cerrar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Botón de voz: activa/desactiva el modo de voz (TTS) de SofLIA */}
        <button
          onClick={toggleVoiceEnabled}
          disabled={isVoiceTogglePending}
          title={isVoiceEnabled ? t('lia.voice.disable') : t('lia.voice.enable')}
          aria-label={isVoiceEnabled ? t('lia.voice.disable') : t('lia.voice.enable')}
          aria-pressed={isVoiceEnabled}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isVoiceEnabled
              ? (isLightTheme ? 'var(--color-gray-200)' : 'rgba(255,255,255,0.1)')
              : 'transparent',
            border: 'none',
            cursor: isVoiceTogglePending ? 'wait' : 'pointer',
            opacity: isVoiceTogglePending ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isVoiceEnabled) {
              e.currentTarget.style.backgroundColor = isLightTheme ? 'var(--color-gray-200)' : 'var(--color-legacy-1e2a35)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isVoiceEnabled) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {isVoiceEnabled ? (
            <Volume2 style={{ width: '18px', height: '18px' }} color={themeColors.accentColor} />
          ) : (
            <VolumeX style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
          )}
        </button>

        {/* Botón de historial */}
        <button
          onClick={() => {
            if (showHistory) {
              closeHistory();
            } else {
              setShowHistory(true);
            }
          }}
          title={showHistory ? 'Volver al chat' : 'Historial'}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: showHistory ? (isLightTheme ? 'var(--color-gray-200)' : 'rgba(255,255,255,0.1)') : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLightTheme ? 'var(--color-gray-200)' : 'var(--color-legacy-1e2a35)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = showHistory
              ? isLightTheme ? 'var(--color-gray-200)' : 'rgba(255,255,255,0.1)'
              : 'transparent')
          }
        >
          <Clock style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
        </button>

        {/* Menú de opciones */}
        <div ref={optionsMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
            title="Opciones"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isOptionsMenuOpen ? (isLightTheme ? 'var(--color-gray-200)' : 'rgba(255,255,255,0.1)') : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isOptionsMenuOpen) {
                e.currentTarget.style.backgroundColor = isLightTheme ? 'var(--color-gray-200)' : 'var(--color-legacy-1e2a35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOptionsMenuOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <MoreVertical style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
          </button>

          {isOptionsMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                right: 'max(12px, env(safe-area-inset-right, 0px))',
                top: 'calc(72px + env(safe-area-inset-top, 0px))',
                backgroundColor: isLightTheme ? 'var(--color-bg-light)' : 'var(--color-gray-800)',
                border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                zIndex: 100000,
                minWidth: 'min(200px, calc(100vw - 24px))',
                maxWidth: 'calc(100vw - 24px)',
                maxHeight: 'calc(var(--soflia-viewport-height, 100dvh) - 88px - env(safe-area-inset-bottom, 0px))',
              }}
            >
              <div style={{ padding: '8px 0' }}>
                <button
                  onClick={() => {
                    setIsPersonalizationOpen(true);
                    setIsOptionsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isLightTheme ? 'var(--color-primary)' : 'var(--color-bg-light)',
                    fontSize: '14px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Settings style={{ width: '16px', height: '16px' }} color={isLightTheme ? 'var(--color-gray-500)' : 'var(--color-legacy-9ca3af)'} />
                  <span>Personalización</span>
                </button>

                <button
                  onClick={() => {
                    clearHistory();
                    setIsOptionsMenuOpen(false);
                  }}
                  disabled={messages.length === 0}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: messages.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: isLightTheme ? 'var(--color-error)' : 'var(--color-legacy-f87171)',
                    fontSize: '14px',
                    opacity: messages.length > 0 ? 1 : 0.5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (messages.length > 0) {
                      e.currentTarget.style.backgroundColor = isLightTheme
                        ? 'rgba(239, 68, 68, 0.05)'
                        : 'rgba(239, 68, 68, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} color={isLightTheme ? 'var(--color-error)' : 'var(--color-legacy-f87171)'} />
                  <span>{t('lia.chat.cleanHistory')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={closePanel}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLightTheme ? 'var(--color-gray-200)' : 'var(--color-legacy-1e2a35)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
        </button>
      </div>
    </div>
  );
}
