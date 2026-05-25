import type { LiaImageAttachment } from '@/core/reporting/report-problem.contract';
import type { SofLIAMessage } from '@/core/types/lia.types';
import type { NormalizedLiaLink } from '../lia-link.utils';
import type { CourseLiaThemeColors } from '../types';
import { parseMarkdownContent } from '../utils/markdown-content';

import { AssistantMessageActions } from './AssistantMessageActions';
import { CourseLiaEditComposer } from './CourseLiaEditComposer';
import { MessageAttachments } from './MessageAttachments';

interface CourseLiaMessageBubbleProps {
  copiedMessageId: string | null;
  editInputRef: React.RefObject<HTMLTextAreaElement>;
  editingValue: string;
  isDarkMode: boolean;
  isEditingThisMessage: boolean;
  isLightTheme: boolean;
  isLoading: boolean;
  message: SofLIAMessage;
  onCancelEditing: () => void;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLinkClick: (link: NormalizedLiaLink) => void;
  onSaveNote?: (content: string) => void;
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessageBubble({
  message,
  isEditingThisMessage,
  themeColors,
  ...props
}: CourseLiaMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '16px', backgroundColor: isUser ? themeColors.messageBubbleUser : themeColors.messageBubbleAssistant }}>
      {isEditingThisMessage ? (
        <CourseLiaEditComposer
          editInputRef={props.editInputRef}
          editingValue={props.editingValue}
          isLoading={props.isLoading}
          onCancelEditing={props.onCancelEditing}
          onEditKeyDown={props.onEditKeyDown}
          onSubmitEditedMessage={props.onSubmitEditedMessage}
          setEditingValue={props.setEditingValue}
          themeColors={themeColors}
        />
      ) : (
        <p className={isUser ? 'lia-msg-user-text' : 'lia-msg-assistant-text'} style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', color: isUser ? 'var(--color-bg-light)' : themeColors.textPrimary }}>
          {message.role === 'assistant'
            ? parseMarkdownContent(message.content, props.onLinkClick, themeColors.assistantLinkColor)
            : message.content}
        </p>
      )}
      <MessageAttachments attachments={message.attachments as LiaImageAttachment[] | undefined} messageId={message.id} />
      {message.role === 'assistant' ? (
        <AssistantMessageActions
          copiedMessageId={props.copiedMessageId}
          isLightTheme={props.isLightTheme}
          message={message}
          onCopyMessage={props.onCopyMessage}
          onSaveNote={props.onSaveNote}
          themeColors={themeColors}
        />
      ) : null}
    </div>
  );
}
