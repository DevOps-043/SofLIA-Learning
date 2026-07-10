import type { RefObject } from 'react';

import type { SofLIAMessage } from '@/core/types/lia.types';
import type { NormalizedLiaLink } from '../lia-link.utils';
import type { CourseLiaProps, CourseLiaThemeColors } from '../types';

import { CourseLiaMessageItem } from './CourseLiaMessageItem';
import { CourseLiaTypingIndicator } from './CourseLiaTypingIndicator';

interface CourseLiaMessagesProps {
  copiedMessageId: string | null;
  editInputRef: RefObject<HTMLTextAreaElement>;
  editingMessageId: string | null;
  editingValue: string;
  forceDarkText: boolean;
  isDarkMode: boolean;
  isLightTheme: boolean;
  isLoading: boolean;
  messages: SofLIAMessage[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onCancelEditing: () => void;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLinkClick: (link: NormalizedLiaLink) => void;
  onSaveNote?: CourseLiaProps['onSaveNote'];
  onStartEditing: (message: SofLIAMessage) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
  stop: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessages(props: CourseLiaMessagesProps) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {props.messages.map((message, index) => (
        <CourseLiaMessageItem
          key={message.id}
          {...props}
          isEditingThisMessage={props.editingMessageId === message.id && message.role === 'user'}
          message={message}
          precedingUserMessage={
            message.role === 'assistant'
              ? [...props.messages.slice(0, index)]
                  .reverse()
                  .find((candidate) => candidate.role === 'user')?.content
              : undefined
          }
        />
      ))}
      {props.isLoading ? (
        <CourseLiaTypingIndicator stop={props.stop} themeColors={props.themeColors} />
      ) : null}
      <div ref={props.messagesEndRef} />
    </div>
  );
}
