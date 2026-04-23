import type { SofLIAMessage } from '../../../../core/types/lia.types';
import type { CourseLiaThemeColors } from './CourseLia.types';
import { parseMarkdownContent } from './course-lia-markdown';
import { CourseLiaMessageActions } from './CourseLiaMessageActions';
import { CourseLiaMessageAttachments } from './CourseLiaMessageAttachments';

interface CourseLiaMessageItemProps {
  copiedMessageId: string | null;
  isDarkMode: boolean;
  isLightTheme: boolean;
  message: SofLIAMessage;
  onCopyMessage: (messageId: string, content: string) => void;
  onLinkClick: (url: string) => void;
  onSaveNote?: (content: string) => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessageItem({
  copiedMessageId,
  isDarkMode,
  isLightTheme,
  message,
  onCopyMessage,
  onLinkClick,
  onSaveNote,
  themeColors,
}: CourseLiaMessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '85%', padding: '12px 16px', borderRadius: '16px', backgroundColor: isUser ? themeColors.messageBubbleUser : themeColors.messageBubbleAssistant }}>
        <p
          className={isUser ? 'lia-msg-user-text' : 'lia-msg-assistant-text'}
          style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}
        >
          {isUser ? message.content : parseMarkdownContent(message.content, onLinkClick, isDarkMode)}
        </p>

        <CourseLiaMessageAttachments attachments={message.attachments} messageId={message.id} />

        {!isUser ? (
          <CourseLiaMessageActions
            content={message.content}
            copiedMessageId={copiedMessageId}
            isLightTheme={isLightTheme}
            messageId={message.id}
            onCopyMessage={onCopyMessage}
            onSaveNote={onSaveNote}
            themeColors={themeColors}
          />
        ) : null}
      </div>
    </div>
  );
}
