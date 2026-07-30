import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { SofLIAMessage } from '@/core/types/lia.types';
import styles from '../CourseLiaPanel.module.css';
import type { CourseLiaProps, CourseLiaThemeColors } from '../types';

import { CourseLiaMessageBubble } from './CourseLiaMessageBubble';

interface CourseLiaMessageItemProps {
  copiedMessageId: string | null;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editingValue: string;
  isDarkMode: boolean;
  isEditingThisMessage: boolean;
  isLoading: boolean;
  message: SofLIAMessage;
  onCancelEditing: () => void;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLinkClick: Parameters<typeof CourseLiaMessageBubble>[0]['onLinkClick'];
  onSaveNote?: CourseLiaProps['onSaveNote'];
  onStartEditing: (message: SofLIAMessage) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  precedingUserMessage?: string;
  setEditingValue: (value: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessageItem({
  isEditingThisMessage,
  isLoading,
  message,
  onStartEditing,
  themeColors,
  ...bubbleProps
}: CourseLiaMessageItemProps) {
  const { t } = useTranslation('learn');
  const canEdit = message.role === 'user' && !isEditingThisMessage && !isLoading;

  return (
    <div className={`${styles.messageRow} ${message.role === 'user' ? styles.messageRowUser : ''}`}>
      {canEdit ? (
        <button
          type="button"
          onClick={() => onStartEditing(message)}
          title={t('lia.editMessage')}
          aria-label={t('lia.editMessage')}
          className={styles.editButton}
        >
          <Pencil style={{ width: '13px', height: '13px' }} />
        </button>
      ) : null}
      <CourseLiaMessageBubble
        {...bubbleProps}
        isEditingThisMessage={isEditingThisMessage}
        isLoading={isLoading}
        message={message}
        themeColors={themeColors}
      />
    </div>
  );
}
