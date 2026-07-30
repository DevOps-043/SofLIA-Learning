import { useVideoPlayerOptional } from '@/app/courses/[slug]/learn/VideoPlayerContext';
import type { LiaImageAttachment } from '@/core/reporting/report-problem.contract';
import type { SofLIAMessage } from '@/core/types/lia.types';
import styles from '../CourseLiaPanel.module.css';
import type { NormalizedLiaLink } from '../lia-link.utils';
import type { CourseLiaProps, CourseLiaThemeColors } from '../types';
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
  isLoading: boolean;
  message: SofLIAMessage;
  onCancelEditing: () => void;
  onCopyMessage: (messageId: string, content: string) => void | Promise<void>;
  onEditKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onLinkClick: (link: NormalizedLiaLink) => void;
  onSaveNote?: CourseLiaProps['onSaveNote'];
  onSubmitEditedMessage: () => void | Promise<void>;
  setEditingValue: (value: string) => void;
  precedingUserMessage?: string;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessageBubble({
  message,
  isEditingThisMessage,
  themeColors,
  ...props
}: CourseLiaMessageBubbleProps) {
  const isUser = message.role === 'user';
  // El chat vive dentro del VideoPlayerProvider en la página de la lección. Fuera
  // de un curso (dashboard, etc.) el contexto no existe y `seekTo` queda como
  // undefined: los timestamps se muestran como texto, no como botones muertos.
  const videoPlayer = useVideoPlayerOptional();
  const onTimestampClick = videoPlayer
    ? (seconds: number) => {
        videoPlayer.seekTo(seconds);
      }
    : undefined;

  return (
    <div
      className={`${styles.messageBubble} ${
        isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant
      }`}
    >
      {isEditingThisMessage ? (
        <CourseLiaEditComposer
          editInputRef={props.editInputRef}
          editingValue={props.editingValue}
          isLoading={props.isLoading}
          onCancelEditing={props.onCancelEditing}
          onEditKeyDown={props.onEditKeyDown}
          onSubmitEditedMessage={props.onSubmitEditedMessage}
          setEditingValue={props.setEditingValue}
        />
      ) : (
        <p className={`${isUser ? 'lia-msg-user-text' : 'lia-msg-assistant-text'} ${styles.messageText}`}>
          {message.role === 'assistant'
            ? parseMarkdownContent(message.content, props.onLinkClick, themeColors.assistantLinkColor, onTimestampClick)
            : message.content}
        </p>
      )}
      <MessageAttachments attachments={message.attachments as LiaImageAttachment[] | undefined} messageId={message.id} />
      {message.role === 'assistant' ? (
        <AssistantMessageActions
          copiedMessageId={props.copiedMessageId}
          message={message}
          onCopyMessage={props.onCopyMessage}
          onSaveNote={props.onSaveNote}
          precedingUserMessage={props.precedingUserMessage}
        />
      ) : null}
    </div>
  );
}
