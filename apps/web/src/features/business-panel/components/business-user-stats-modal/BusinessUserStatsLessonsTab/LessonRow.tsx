import { motion } from 'framer-motion';
import {
  ActivityBadge,
  QuizBadge,
  VideoBadge
} from './LessonProgressBadges';
import {
  LiasBadge,
  NotesBadge,
  TimeSpentBadge
} from './LessonEngagementBadges';
import type { LessonRowProps } from './types';

export function LessonRow({ lesson, index, theme, t }: LessonRowProps) {
  const statusDot = {
    completed: theme.successColor,
    in_progress: theme.warningColor,
    not_started: `color-mix(in srgb, ${theme.textColor} 18.8%, transparent)`
  }[lesson.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-2xl border transition-colors"
      style={{
        backgroundColor: lesson.status === 'completed'
          ? `color-mix(in srgb, ${theme.successColor} 3.1%, transparent)`
          : `color-mix(in srgb, ${theme.textColor} 1.6%, transparent)`,
        borderColor: theme.modalBorder
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDot }} />
        <span className="text-xs font-semibold truncate" style={{ color: theme.textColor }}>
          {lesson.lesson_order !== null ? `${lesson.lesson_order}. ` : ''}
          {lesson.lesson_title ?? t('users.modals.stats.lessons.untitledLesson')}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 shrink-0 pl-5 sm:pl-0">
        <VideoBadge lesson={lesson} theme={theme} t={t} />
        <ActivityBadge lesson={lesson} theme={theme} t={t} />
        <QuizBadge lesson={lesson} theme={theme} t={t} />
        <LiasBadge lesson={lesson} theme={theme} t={t} />
        <NotesBadge lesson={lesson} theme={theme} t={t} />
        <TimeSpentBadge lesson={lesson} theme={theme} t={t} />
      </div>
    </motion.div>
  );
}
