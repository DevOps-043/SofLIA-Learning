import { Send, Square } from 'lucide-react';

import type { CourseLiaThemeColors } from './CourseLia.types';

interface CourseLiaSendButtonProps {
  canSendMessage: boolean;
  isLightTheme: boolean;
  isLoading: boolean;
  isMobile: boolean;
  onClick: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaSendButton({
  canSendMessage,
  isLightTheme,
  isLoading,
  isMobile,
  onClick,
  themeColors,
}: CourseLiaSendButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canSendMessage}
      title={isLoading ? 'Detener generacion de SofLIA' : 'Enviar mensaje'}
      aria-label={isLoading ? 'Detener generacion de SofLIA' : 'Enviar mensaje'}
      style={{
        minWidth: isLoading ? (isMobile ? 'auto' : '112px') : '44px',
        maxWidth: isLoading && isMobile ? '30%' : undefined,
        height: '44px',
        padding: isLoading ? (isMobile ? '0 8px' : '0 14px') : '0',
        borderRadius: isLoading ? '16px' : '50%',
        backgroundColor: isLoading ? (isLightTheme ? '#DC2626' : '#EF4444') : canSendMessage ? themeColors.primaryAction : isLightTheme ? '#CBD5E1' : '#374151',
        border: 'none',
        cursor: canSendMessage ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isLoading ? '8px' : '0',
        flexShrink: 0,
        transition: 'all 180ms ease',
      }}
    >
      {isLoading ? (
        <>
          <Square style={{ width: '15px', height: '15px', color: '#FFFFFF', fill: '#FFFFFF' }} />
          <span style={{ color: '#FFFFFF', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Detener
          </span>
        </>
      ) : (
        <Send style={{ width: '16px', height: '16px', color: canSendMessage ? (isLightTheme ? '#FFFFFF' : '#0A2540') : isLightTheme ? '#6B7280' : '#4B5563' }} />
      )}
    </button>
  );
}
