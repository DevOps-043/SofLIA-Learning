import { useCallback, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';

import type { CourseLessonContext, SofLIAMessage } from '@/core/types/lia.types';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';

interface UseMessageEditActionsArgs {
  closeLia: () => void;
  editingMessageId: string | null;
  editingValue: string;
  editMessageAndRegenerate: UseLiaCourseChatReturn['editMessageAndRegenerate'];
  isInteractionBlocked: boolean;
  isLoading: boolean;
  resolvedLessonContext?: CourseLessonContext;
  setEditingMessageId: Dispatch<SetStateAction<string | null>>;
  setEditingValue: Dispatch<SetStateAction<string>>;
}

export function useMessageEditActions(args: UseMessageEditActionsArgs) {
  const handleStartEditingMessage = useCallback((message: SofLIAMessage) => {
    if (args.isInteractionBlocked || args.isLoading || message.role !== 'user') {
      return;
    }

    args.setEditingMessageId(message.id);
    args.setEditingValue(message.content);
  }, [args]);

  const handleCancelEditingMessage = useCallback(() => {
    args.setEditingMessageId(null);
    args.setEditingValue('');
  }, [args]);

  const handleSubmitEditedMessage = useCallback(async () => {
    if (args.isInteractionBlocked) {
      args.closeLia();
      return;
    }

    if (!args.editingMessageId || !args.editingValue.trim() || args.isLoading) {
      return;
    }

    const messageId = args.editingMessageId;
    const nextMessage = args.editingValue.trim();
    args.setEditingMessageId(null);
    args.setEditingValue('');
    await args.editMessageAndRegenerate(messageId, nextMessage, args.resolvedLessonContext, undefined);
  }, [args]);

  const handleEditKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmitEditedMessage();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelEditingMessage();
    }
  }, [handleCancelEditingMessage, handleSubmitEditedMessage]);

  return { handleStartEditingMessage, handleCancelEditingMessage, handleSubmitEditedMessage, handleEditKeyDown };
}
