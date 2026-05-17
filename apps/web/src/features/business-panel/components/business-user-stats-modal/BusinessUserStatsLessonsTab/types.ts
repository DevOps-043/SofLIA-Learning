import type { BusinessUserStatsTabProps } from '../types';
import type { CourseWithLessons, LessonDetail } from '../../../types/business-user-stats.types';

export interface LessonBadgeProps {
  lesson: LessonDetail;
  theme: BusinessUserStatsTabProps['theme'];
  t: BusinessUserStatsTabProps['t'];
}

export interface LessonRowProps extends LessonBadgeProps {
  index: number;
}

export interface CourseAccordionProps {
  courseData: CourseWithLessons;
  courseIndex: number;
  defaultOpen: boolean;
  theme: BusinessUserStatsTabProps['theme'];
  t: BusinessUserStatsTabProps['t'];
}
