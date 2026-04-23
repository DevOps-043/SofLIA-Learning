import { Trash2, X } from 'lucide-react';

import type { CourseLiaThemeColors } from './CourseLia.types';

interface CourseLiaPanelHeaderProps {
  isLightTheme: boolean;
  onClearHistory: () => void;
  onClose: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaPanelHeader({
  isLightTheme,
  onClearHistory,
  onClose,
  themeColors,
}: CourseLiaPanelHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${themeColors.borderColor}`, backgroundColor: themeColors.headerBg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <img src="/lia-avatar.png" alt="SofLIA" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themeColors.accentColor}` }} />
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', backgroundColor: '#22c55e', borderRadius: '50%', border: `2px solid ${themeColors.panelBg}` }} />
        </div>
        <div>
          <h2 className="lia-header-title" style={{ color: themeColors.textPrimary, fontSize: '16px', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
            SofLIA
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={onClearHistory}
          title="Borrar conversacion"
          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Trash2 style={{ width: '18px', height: '18px' }} color={isLightTheme ? '#ef4444' : '#f87171'} />
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: '18px', height: '18px' }} color={isLightTheme ? '#1E293B' : themeColors.textSecondary} />
        </button>
      </div>
    </div>
  );
}
