import { useCallback, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';

import type { CourseLessonContext } from '@/core/types/lia.types';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';
import type { ActivityContextType } from '@/features/courses/context/LiaCourseContext';

interface UseMessageSendActionsArgs {
  closeLia: () => void;
  currentActivity: ActivityContextType | null;
  inputValue: string;
  isInteractionBlocked: boolean;
  isListening: boolean;
  isLoading: boolean;
  liaChat: Pick<UseLiaCourseChatReturn, 'getCurrentConversationId'>;
  resolvedLessonContext?: CourseLessonContext;
  sendMessage: UseLiaCourseChatReturn['sendMessage'];
  setInputValue: Dispatch<SetStateAction<string>>;
  stop: UseLiaCourseChatReturn['stop'];
  toggleListening: () => Promise<void> | void;
}

export function useMessageSendActions(args: UseMessageSendActionsArgs) {
  const handleSendMessage = useCallback(async () => {
    if (args.isInteractionBlocked) {
      args.closeLia();
      return;
    }

    if (!args.inputValue.trim() || args.isLoading) {
      return;
    }

    const message = args.inputValue.trim();
    args.setInputValue('');
    await args.sendMessage(message, args.resolvedLessonContext, undefined, false);

    if (args.currentActivity?.type === 'ai_chat') {
      await args.currentActivity.onUserMessageCompleted?.(args.liaChat.getCurrentConversationId());
    }
  }, [args]);

  const handlePrimaryAction = useCallback(() => {
    if (args.isInteractionBlocked) {
      args.closeLia();
      return;
    }

    if (args.isLoading) {
      args.stop();
      return;
    }

    if (!args.inputValue.trim()) {
      void args.toggleListening();
      return;
    }

    if (args.isListening) {
      void args.toggleListening();
    }

    void handleSendMessage();
  }, [args, handleSendMessage]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  }, [handleSendMessage]);

  return { handleSendMessage, handlePrimaryAction, handleKeyDown };
}
