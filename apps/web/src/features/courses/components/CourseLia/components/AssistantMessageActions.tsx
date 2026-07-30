import { Check, Copy, StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { convertNoteMarkdownToHtml } from '@/core/components/NotesModal/shared/notes-markdown-to-html.service';
import type { SofLIAMessage } from '@/core/types/lia.types';
import { normalizeGeneratedNoteHtml } from '@/lib/notes/generated-note-html';
import styles from '../CourseLiaPanel.module.css';
import type { CourseLiaProps } from '../types';

interface AssistantMessageActionsProps {
  copiedMessageId: string | null;
  message: SofLIAMessage;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onSaveNote?: CourseLiaProps['onSaveNote'];
  precedingUserMessage?: string;
}

export function AssistantMessageActions({
  copiedMessageId,
  message,
  onCopyMessage,
  onSaveNote,
  precedingUserMessage,
}: AssistantMessageActionsProps) {
  const { t } = useTranslation('learn');
  const wasCopied = copiedMessageId === message.id;

  return (
    <div className={styles.assistantActions}>
      <button
        type="button"
        onClick={() => void onCopyMessage(message.id, message.content)}
        title={wasCopied ? t('lia.copiedMessage') : t('lia.copyMessage')}
        aria-label={wasCopied ? t('lia.copiedMessage') : t('lia.copyMessage')}
        className={`${styles.messageAction} ${wasCopied ? styles.messageActionSuccess : ''}`}
      >
        {wasCopied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
      </button>
      {onSaveNote ? (
        <button
          type="button"
          onClick={() =>
            onSaveNote(
              normalizeGeneratedNoteHtml(
                convertNoteMarkdownToHtml(message.content),
                'lesson_auto_note',
              ),
              {
                chatProvenance: message.chatProvenance,
                question: precedingUserMessage,
              },
            )
          }
          title={t('lia.createNote')}
          aria-label={t('lia.createNote')}
          className={styles.messageAction}
        >
          <StickyNote style={{ width: '14px', height: '14px' }} />
        </button>
      ) : null}
    </div>
  );
}
