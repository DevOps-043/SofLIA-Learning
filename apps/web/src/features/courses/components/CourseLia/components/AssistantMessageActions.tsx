import { Check, Copy, StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { convertNoteMarkdownToHtml } from '@/core/components/NotesModal/shared/notes-markdown-to-html.service';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type { CourseLiaThemeColors } from '../types';

interface AssistantMessageActionsProps {
  copiedMessageId: string | null;
  isLightTheme: boolean;
  message: SofLIAMessage;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onSaveNote?: (content: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function AssistantMessageActions({
  copiedMessageId,
  isLightTheme,
  message,
  onCopyMessage,
  onSaveNote,
  themeColors,
}: AssistantMessageActionsProps) {
  const { t } = useTranslation('learn');
  const wasCopied = copiedMessageId === message.id;

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end', opacity: 0.7 }}>
      <button
        type="button"
        onClick={() => void onCopyMessage(message.id, message.content)}
        title={wasCopied ? t('lia.copiedMessage') : t('lia.copyMessage')}
        aria-label={wasCopied ? t('lia.copiedMessage') : t('lia.copyMessage')}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          color: wasCopied ? themeColors.accentColor : isLightTheme ? '#64748B' : themeColors.textSecondary,
        }}
      >
        {wasCopied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
      </button>
      {onSaveNote ? (
        <button
          type="button"
          onClick={() => onSaveNote(convertNoteMarkdownToHtml(message.content))}
          title={t('lia.createNote')}
          aria-label={t('lia.createNote')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: isLightTheme ? '#64748B' : themeColors.textSecondary }}
        >
          <StickyNote style={{ width: '14px', height: '14px' }} />
        </button>
      ) : null}
    </div>
  );
}
