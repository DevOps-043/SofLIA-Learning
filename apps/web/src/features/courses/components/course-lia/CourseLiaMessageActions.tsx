import { Check, Copy, StickyNote } from 'lucide-react';

import type { CourseLiaThemeColors } from './CourseLia.types';
import { toCourseLiaNoteHtml } from './course-lia-note';

interface CourseLiaMessageActionsProps {
  content: string;
  copiedMessageId: string | null;
  isLightTheme: boolean;
  messageId: string;
  onCopyMessage: (messageId: string, content: string) => void;
  onSaveNote?: (content: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessageActions({
  content,
  copiedMessageId,
  isLightTheme,
  messageId,
  onCopyMessage,
  onSaveNote,
  themeColors,
}: CourseLiaMessageActionsProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end', opacity: 0.7 }}>
      <button
        type="button"
        onClick={() => onCopyMessage(messageId, content)}
        title={copiedMessageId === messageId ? 'Texto copiado' : 'Copiar texto'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          color: copiedMessageId === messageId ? themeColors.accentColor : isLightTheme ? '#64748B' : themeColors.textSecondary,
        }}
      >
        {copiedMessageId === messageId ? (
          <Check style={{ width: '14px', height: '14px' }} />
        ) : (
          <Copy style={{ width: '14px', height: '14px' }} />
        )}
      </button>

      {onSaveNote ? (
        <button
          type="button"
          onClick={() => onSaveNote(toCourseLiaNoteHtml(content))}
          title="Guardar como nota"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: isLightTheme ? '#64748B' : themeColors.textSecondary }}
        >
          <StickyNote style={{ width: '14px', height: '14px' }} />
        </button>
      ) : null}
    </div>
  );
}
