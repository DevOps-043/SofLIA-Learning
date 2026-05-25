import { useTranslation } from 'react-i18next';

import { LIA_AVATAR_SRC } from '../constants';
import type { CourseLiaThemeColors } from '../types';

interface CourseLiaTypingIndicatorProps {
  stop: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaTypingIndicator({
  stop,
  themeColors,
}: CourseLiaTypingIndicatorProps) {
  const { t } = useTranslation('learn');

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px' }}>
      <div
        className="animate-pulse"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${themeColors.accentColor}`,
        }}
      >
        <img src={LIA_AVATAR_SRC} alt={t('lia.typing')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <button type="button" onClick={stop} title={t('lia.stopGeneration')} style={{ display: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <rect x="9" y="9" width="6" height="6" />
        </svg>
      </button>
    </div>
  );
}
