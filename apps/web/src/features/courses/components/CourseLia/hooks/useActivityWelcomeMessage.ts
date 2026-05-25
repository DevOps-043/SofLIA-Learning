import { useEffect, type MutableRefObject } from 'react';

import type { CourseLessonContext } from '@/core/types/lia.types';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';
import type { ActivityContextType } from '@/features/courses/context/LiaCourseContext';

import { buildActivityWelcomeTrigger } from '../utils/activity-welcome-trigger';

interface UseActivityWelcomeMessageArgs {
  clearHistory: UseLiaCourseChatReturn['clearHistory'];
  currentActivity: ActivityContextType | null;
  isOpen: boolean;
  prevActivityTriggerRef: MutableRefObject<number | null>;
  resolvedLessonContext?: CourseLessonContext;
  sendMessage: UseLiaCourseChatReturn['sendMessage'];
}

export function useActivityWelcomeMessage({
  clearHistory,
  currentActivity,
  isOpen,
  prevActivityTriggerRef,
  resolvedLessonContext,
  sendMessage,
}: UseActivityWelcomeMessageArgs) {
  useEffect(() => {
    if (!isOpen || !currentActivity || currentActivity.timestamp === prevActivityTriggerRef.current) {
      return;
    }

    prevActivityTriggerRef.current = currentActivity.timestamp || null;
    const triggerWelcomeByActivity = async () => {
      clearHistory();
      const baseActivitiesContext = resolvedLessonContext?.activitiesContext;
      const context: CourseLessonContext = {
        ...resolvedLessonContext,
        activitiesContext: {
          totalActivities: baseActivitiesContext?.totalActivities ?? 0,
          requiredActivities: baseActivitiesContext?.requiredActivities ?? 0,
          completedActivities: baseActivitiesContext?.completedActivities ?? 0,
          pendingRequiredCount: baseActivitiesContext?.pendingRequiredCount ?? 0,
          pendingRequiredTitles: baseActivitiesContext?.pendingRequiredTitles,
          activityTypes: baseActivitiesContext?.activityTypes,
          currentActivityFocus: {
            title: currentActivity.title,
            type: currentActivity.type,
            isRequired: baseActivitiesContext?.currentActivityFocus?.isRequired ?? false,
            isCompleted: baseActivitiesContext?.currentActivityFocus?.isCompleted ?? false,
            description: currentActivity.description || currentActivity.title,
            prompts: currentActivity.prompts,
          },
        },
      };

      await sendMessage(buildActivityWelcomeTrigger(currentActivity), context, undefined, true);
    };

    void triggerWelcomeByActivity();
  }, [clearHistory, currentActivity, isOpen, prevActivityTriggerRef, resolvedLessonContext, sendMessage]);
}
