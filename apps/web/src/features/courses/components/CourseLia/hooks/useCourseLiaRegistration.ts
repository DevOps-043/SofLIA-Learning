import { useEffect } from 'react';

import type { CourseLessonContext } from '@/core/types/lia.types';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';

interface UseCourseLiaRegistrationArgs {
  liaChat: UseLiaCourseChatReturn;
  registerLiaChat: (chat: UseLiaCourseChatReturn | null) => void;
  resolvedLessonContext?: CourseLessonContext;
  setCourseContext: (context: CourseLessonContext | null) => void;
}

export function useCourseLiaRegistration({
  liaChat,
  registerLiaChat,
  resolvedLessonContext,
  setCourseContext,
}: UseCourseLiaRegistrationArgs) {
  useEffect(() => {
    registerLiaChat(liaChat);
    return () => registerLiaChat(null);
  }, [liaChat, registerLiaChat]);

  useEffect(() => {
    setCourseContext(resolvedLessonContext || null);
    return () => setCourseContext(null);
  }, [resolvedLessonContext, setCourseContext]);
}
