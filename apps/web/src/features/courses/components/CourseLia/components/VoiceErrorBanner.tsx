import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { COURSE_LIA_COLORS } from '../constants';

interface VoiceErrorBannerProps {
  isLightTheme: boolean;
  message: string | null;
  onDismiss: () => void;
}

export function VoiceErrorBanner({
  isLightTheme,
  message,
  onDismiss,
}: VoiceErrorBannerProps) {
  const { t } = useTranslation('common');

  if (!message) {
    return null;
  }

  return (
    <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.12)', color: isLightTheme ? COURSE_LIA_COLORS.warningTextLight : COURSE_LIA_COLORS.warningTextDark, fontSize: '12px', border: '1px solid rgba(245,158,11,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', lineHeight: 1, padding: 0 }}
        aria-label={t('actions.close')}
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
}
