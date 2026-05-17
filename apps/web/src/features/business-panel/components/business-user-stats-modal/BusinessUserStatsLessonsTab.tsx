'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { BusinessUserStatsEmptyState } from './shared';
import type { BusinessUserStatsTabProps } from './types';
import { CourseAccordion } from './BusinessUserStatsLessonsTab/CourseAccordion';

export function BusinessUserStatsLessonsTab({
  stats,
  t,
  theme,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme'>) {
  const courses = stats.courses_with_lessons ?? [];

  if (courses.length === 0) {
    return (
      <BusinessUserStatsEmptyState
        icon={BookOpen}
        label={t('users.modals.stats.lessons.empty')}
        theme={theme}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <h3
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"
        style={{ color: theme.mutedTextColor }}
      >
        <BookOpen className="h-4 w-4" style={{ color: theme.primaryColor }} />
        {t('users.modals.stats.lessons.title')}
      </h3>
      <div className="space-y-4">
        {courses.map((courseData, index) => (
          <CourseAccordion
            key={courseData.course_id}
            courseData={courseData}
            courseIndex={index}
            defaultOpen={index === 0}
            theme={theme}
            t={t}
          />
        ))}
      </div>
    </motion.div>
  );
}
