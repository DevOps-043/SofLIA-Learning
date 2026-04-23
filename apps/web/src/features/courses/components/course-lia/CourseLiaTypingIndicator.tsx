import type { CourseLiaThemeColors } from './CourseLia.types';

interface CourseLiaTypingIndicatorProps {
  isLoading: boolean;
  onStop: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaTypingIndicator({
  isLoading,
  onStop,
  themeColors,
}: CourseLiaTypingIndicatorProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px' }}>
      <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${themeColors.accentColor}` }}>
        <img src="/lia-avatar.png" alt="Escribiendo..." style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <button type="button" onClick={onStop} title="Detener generacion" style={{ display: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <rect x="9" y="9" width="6" height="6" />
        </svg>
      </button>
    </div>
  );
}
