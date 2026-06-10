import { Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { COURSE_LIA_COLORS, LIA_AVATAR_SRC } from '../constants';
import type { CourseLiaThemeColors } from '../types';

interface CourseLiaHeaderProps {
  isLightTheme: boolean;
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  isVoiceTogglePending: boolean;
  onClearHistory: () => void;
  onClose: () => void;
  onToggleVoice: () => void;
  themeColors: CourseLiaThemeColors;
  isMobile?: boolean;
}

export function CourseLiaHeader({
  isLightTheme,
  isSpeaking,
  isVoiceEnabled,
  isVoiceTogglePending,
  onClearHistory,
  onClose,
  onToggleVoice,
  themeColors,
  isMobile = false,
}: CourseLiaHeaderProps) {
  const { t } = useTranslation('learn');
  const { t: tc } = useTranslation('common');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile
        ? 'calc(16px + env(safe-area-inset-top, 0px)) 20px 16px'
        : '16px 20px',
      borderBottom: `1px solid ${themeColors.borderColor}`,
      backgroundColor: themeColors.headerBg
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <img src={LIA_AVATAR_SRC} alt={t('lia.title')} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themeColors.accentColor}` }} />
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', backgroundColor: COURSE_LIA_COLORS.success, borderRadius: '50%', border: `2px solid ${themeColors.panelBg}` }} />
        </div>
        <div>
          <h2 className="lia-header-title" style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
            {t('lia.title')}
          </h2>
          {isSpeaking && (
            <p aria-live="polite" style={{ color: themeColors.accentColor, fontSize: '12px', fontWeight: 500, margin: 0 }}>
              {tc('lia.header.speaking')}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Botón de voz: activa/desactiva el modo de voz (TTS) de SofLIA */}
        <button
          type="button"
          onClick={onToggleVoice}
          disabled={isVoiceTogglePending}
          title={isVoiceEnabled ? tc('lia.voice.disable') : tc('lia.voice.enable')}
          aria-label={isVoiceEnabled ? tc('lia.voice.disable') : tc('lia.voice.enable')}
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
        >
          {isVoiceEnabled ? (
            <Volume2 style={{ width: '18px', height: '18px' }} color={themeColors.accentColor} />
          ) : (
            <VolumeX style={{ width: '18px', height: '18px' }} color={themeColors.textSecondary} />
          )}
        </button>
        <button
          type="button"
          onClick={onClearHistory}
          title={t('lia.resetConversation')}
          aria-label={t('lia.resetConversation')}
          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Trash2 style={{ width: '18px', height: '18px' }} color={isLightTheme ? COURSE_LIA_COLORS.error : COURSE_LIA_COLORS.errorLight} />
        </button>
        <button
          type="button"
          onClick={onClose}
          title={tc('actions.close')}
          aria-label={tc('actions.close')}
          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: '18px', height: '18px' }} color={isLightTheme ? COURSE_LIA_COLORS.textLight : themeColors.textSecondary} />
        </button>
      </div>
    </div>
  );
}
