'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, MoreVertical, Settings, Trash2 } from 'lucide-react';
import { LiaThemeColors, LiaMessage } from './types';

interface PanelHeaderProps {
  t: (key: string) => string;
  themeColors: LiaThemeColors;
  isLightTheme: boolean;
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
        padding: '20px 24px',
        borderBottom: `1px solid ${themeColors.borderColor}`,
        backgroundColor: themeColors.headerBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar de LIA */}
        <div style={{ position: 'relative' }}>
          <motion.img
            layoutId="lia-avatar-header"
            src="/lia-avatar.png"
            alt="SofLIA"
            onClick={() => setIsAvatarExpanded(true)}
            whileHover={{ scale: 1.05 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${themeColors.accentColor}`,
              cursor: 'zoom-in',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '14px',
              height: '14px',
              backgroundColor: '#22c55e',
              borderRadius: '50%',
              border: `2px solid ${themeColors.panelBg}`,
            }}
          />
        </div>

        <div>
          <h2 style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
            {t('lia.header.title')}
          </h2>
          <p style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}>
            {t('lia.header.subtitle')}
          </p>
        </div>
      </div>

      {/* Acciones: historial, opciones, cerrar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            backgroundColor: showHistory ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = showHistory
              ? isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)'
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
              backgroundColor: isOptionsMenuOpen ? (isLightTheme ? '#e2e8f0' : 'rgba(255,255,255,0.1)') : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isOptionsMenuOpen) {
                e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35';
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
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                backgroundColor: isLightTheme ? '#FFFFFF' : '#1E2329',
                border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                zIndex: 100000,
                minWidth: '200px',
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
                    color: isLightTheme ? '#0A2540' : '#FFFFFF',
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
                  <Settings style={{ width: '16px', height: '16px' }} color={isLightTheme ? '#6C757D' : '#9CA3AF'} />
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
                    color: isLightTheme ? '#ef4444' : '#f87171',
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
                  <Trash2 style={{ width: '16px', height: '16px' }} color={isLightTheme ? '#ef4444' : '#f87171'} />
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
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLightTheme ? '#E2E8F0' : '#1e2a35')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
        </button>
      </div>
    </div>
  );
}
