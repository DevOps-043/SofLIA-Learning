import { useCallback } from 'react';
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';

import type { CourseLessonContext } from '../../../../core/types/lia.types';
import type { UseLiaCourseChatReturn } from '../../../../core/hooks/useLiaCourseChat';
import type { CourseLiaAttachmentState } from './useCourseLiaAttachments';

interface CourseLiaActionsArgs {
  attachments: CourseLiaAttachmentState;
  inputValue: string;
  isLoading: boolean;
  resolvedLessonContext: CourseLessonContext | undefined;
  sendMessage: UseLiaCourseChatReturn['sendMessage'];
  setInputValue: Dispatch<SetStateAction<string>>;
  stop: () => void;
}

export function useCourseLiaActions({
  attachments,
  inputValue,
  isLoading,
  resolvedLessonContext,
  sendMessage,
  setInputValue,
  stop,
}: CourseLiaActionsArgs) {
  const { selectedAttachment, setAttachmentError, setSelectedAttachment } = attachments;
  const canSendMessage = Boolean(isLoading || inputValue.trim() || selectedAttachment);

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && !selectedAttachment) || isLoading) {
      return;
    }

    const message = inputValue.trim();
    const attachmentToSend = selectedAttachment;
    setInputValue('');
    setSelectedAttachment(null);
    setAttachmentError(null);

    await sendMessage(
      message,
      resolvedLessonContext,
      undefined,
      false,
      attachmentToSend ? [attachmentToSend] : [],
    );
  }, [
    inputValue,
    isLoading,
    resolvedLessonContext,
    selectedAttachment,
    sendMessage,
    setAttachmentError,
    setInputValue,
    setSelectedAttachment,
  ]);

  const handlePrimaryAction = useCallback(() => {
    if (isLoading) {
      stop();
      return;
    }

    void handleSendMessage();
  }, [handleSendMessage, isLoading, stop]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return { canSendMessage, handleKeyDown, handlePrimaryAction, handleSendMessage };
}
