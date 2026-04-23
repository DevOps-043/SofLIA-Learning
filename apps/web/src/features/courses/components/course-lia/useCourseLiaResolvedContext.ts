import { useMemo } from 'react';

import type { CourseLessonContext } from '../../../../core/types/lia.types';
import type { CourseLiaProps } from './CourseLia.types';

type CourseLiaContextInput = Pick<
  CourseLiaProps,
  | 'courseSlug'
  | 'lessonContent'
  | 'lessonContext'
  | 'lessonId'
  | 'lessonTitle'
  | 'summaryContent'
  | 'transcriptContent'
>;

export function useCourseLiaResolvedContext({
  courseSlug,
  lessonContent,
  lessonContext,
  lessonId,
  lessonTitle,
  summaryContent,
  transcriptContent,
}: CourseLiaContextInput) {
  return useMemo<CourseLessonContext | undefined>(() => {
    const hasLegacyContext = Boolean(
      lessonId || lessonTitle || courseSlug || transcriptContent || summaryContent || lessonContent,
    );

    if (!lessonContext && !hasLegacyContext) {
      return undefined;
    }

    return {
      ...lessonContext,
      lessonId: lessonContext?.lessonId ?? lessonId,
      lessonTitle: lessonContext?.lessonTitle ?? lessonTitle,
      courseSlug: lessonContext?.courseSlug ?? courseSlug,
      transcriptContent: lessonContext?.transcriptContent ?? transcriptContent ?? undefined,
      summaryContent: lessonContext?.summaryContent ?? summaryContent ?? undefined,
      lessonDescription: lessonContext?.lessonDescription ?? lessonContent ?? undefined,
    };
  }, [
    courseSlug,
    lessonContent,
    lessonContext,
    lessonId,
    lessonTitle,
    summaryContent,
    transcriptContent,
  ]);
}
