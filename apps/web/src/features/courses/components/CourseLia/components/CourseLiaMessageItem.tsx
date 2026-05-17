import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { SofLIAMessage } from '@/core/types/lia.types';
import type { CourseLiaThemeColors } from '../types';

import { CourseLiaMessageBubble } from './CourseLiaMessageBubble';

interface CourseLiaMessageItemProps {
  copiedMessageId: string | null;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editingValue: string;
  forceDarkText: boolean;
  isDarkMode: boolean;
  isEditingThisMessage: boolean;
  isLightTheme: boolean;
  isLoading: boolean;
  message: SofLIAMessage;
  onCancelEditing: () => void;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLinkClick: Parameters<typeof CourseLiaMessageBubble>[0]['onLinkClick'];
  onSaveNote?: (content: string) => void;
  onStartEditing: (message: SofLIAMessage) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessageItem({
  isEditingThisMessage,
  isLightTheme,
  isLoading,
  message,
  onStartEditing,
  themeColors,
  ...bubbleProps
}: CourseLiaMessageItemProps) {
  const { t } = useTranslation('learn');
  const canEdit = message.role === 'user' && !isEditingThisMessage && !isLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', gap: '6px' }}>
      {canEdit ? (
        <button
          type="button"
          onClick={() => onStartEditing(message)}
          title={t('lia.editMessage')}
          aria-label={t('lia.editMessage')}
          style={{ width: '26px', height: '26px', borderRadius: '50%', background: isLightTheme ? '#F1F5F9' : 'rgba(255,255,255,0.08)', border: `1px solid ${isLightTheme ? '#CBD5E1' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLightTheme ? '#475569' : 'rgba(255,255,255,0.75)', flexShrink: 0 }}
        >
          <Pencil style={{ width: '13px', height: '13px' }} />
        </button>
      ) : null}
      <CourseLiaMessageBubble
        {...bubbleProps}
        isEditingThisMessage={isEditingThisMessage}
        isLightTheme={isLightTheme}
        isLoading={isLoading}
        message={message}
        themeColors={themeColors}
      />
    </div>
  );
}
