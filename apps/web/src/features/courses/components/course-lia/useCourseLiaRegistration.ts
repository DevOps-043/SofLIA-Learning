import { useEffect, useRef } from 'react';

import type { UseLiaCourseChatReturn } from '../../../../core/hooks/useLiaCourseChat';
import type { CourseLessonContext } from '../../../../core/types/lia.types';
import type { ActivityContextType } from '../../context/LiaCourseContext';
import {
  buildActivitySystemTrigger,
  buildActivityWelcomeContext,
} from './course-lia-activity';

interface CourseLiaRegistrationArgs {
  currentActivity: ActivityContextType | null;
  isOpen: boolean;
  liaChat: UseLiaCourseChatReturn;
  registerLiaChat: (chat: UseLiaCourseChatReturn | null) => void;
  resolvedLessonContext: CourseLessonContext | undefined;
  setCourseContext: (context: CourseLessonContext | null) => void;
}

export function useCourseLiaRegistration({
  currentActivity,
  isOpen,
  liaChat,
  registerLiaChat,
  resolvedLessonContext,
  setCourseContext,
}: CourseLiaRegistrationArgs) {
  const prevActivityTriggerRef = useRef<number | null>(null);
  const { clearHistory, sendMessage } = liaChat;

  useEffect(() => {
    registerLiaChat(liaChat);
    return () => registerLiaChat(null);
  }, [liaChat, registerLiaChat]);

  useEffect(() => {
    setCourseContext(resolvedLessonContext || null);
    return () => setCourseContext(null);
  }, [resolvedLessonContext, setCourseContext]);

  useEffect(() => {
    if (!isOpen || !currentActivity || currentActivity.timestamp === prevActivityTriggerRef.current) {
      return;
    }

    prevActivityTriggerRef.current = currentActivity.timestamp || null;

    const triggerWelcomeByActivity = async () => {
      clearHistory();
      await sendMessage(
        buildActivitySystemTrigger(currentActivity),
        buildActivityWelcomeContext(currentActivity, resolvedLessonContext),
        undefined,
        true,
      );
    };

    void triggerWelcomeByActivity();
  }, [clearHistory, currentActivity, isOpen, resolvedLessonContext, sendMessage]);
}
