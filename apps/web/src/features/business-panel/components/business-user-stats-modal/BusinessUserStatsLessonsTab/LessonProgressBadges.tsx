import type React from 'react';
import { CheckCircle2, MinusCircle, Play, XCircle } from 'lucide-react';
import type { LessonBadgeProps } from './types';

export function VideoBadge({ lesson, theme, t }: LessonBadgeProps) {
  if (lesson.video_watched) {
    return (
      <Badge color={theme.successColor} bg={`${theme.successColor}20`}>
        <Play className="w-2.5 h-2.5 fill-current" />
        {t('users.modals.stats.lessons.badges.video.watched')}
      </Badge>
    );
  }

  if (lesson.video_progress_pct > 0) {
    return (
      <Badge color={theme.warningColor} bg={`${theme.warningColor}20`}>
        <Play className="w-2.5 h-2.5" />
        {lesson.video_progress_pct}%
      </Badge>
    );
  }

  return (
    <Badge color={theme.textColor} bg={`${theme.textColor}10`} dimmed>
      <Play className="w-2.5 h-2.5" />
      {t('users.modals.stats.lessons.badges.video.notWatched')}
    </Badge>
  );
}

export function ActivityBadge({ lesson, theme, t }: LessonBadgeProps) {
  if (lesson.activities_total === 0) {
    return (
      <Badge color={theme.textColor} bg={`${theme.textColor}10`} dimmed>
        <MinusCircle className="w-2.5 h-2.5" />
        {t('users.modals.stats.lessons.badges.activity.empty')}
      </Badge>
    );
  }

  const countLabel = t('users.modals.stats.lessons.badges.activity.count', {
    completed: lesson.activities_completed,
    total: lesson.activities_total
  });

  return (
    <Badge
      color={lesson.activity_done ? theme.successColor : theme.warningColor}
      bg={`${lesson.activity_done ? theme.successColor : theme.warningColor}20`}
    >
      {lesson.activity_done ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : (
        <MinusCircle className="w-2.5 h-2.5" />
      )}
      {countLabel}
    </Badge>
  );
}

export function QuizBadge({ lesson, theme, t }: LessonBadgeProps) {
  if (!lesson.quiz_completed) {
    return (
      <Badge color={theme.textColor} bg={`${theme.textColor}10`} dimmed>
        {t('users.modals.stats.lessons.badges.quiz.empty')}
      </Badge>
    );
  }

  if (lesson.quiz_passed) {
    return (
      <Badge color={theme.successColor} bg={`${theme.successColor}20`}>
        <CheckCircle2 className="w-2.5 h-2.5" />
        {lesson.quiz_score !== null
          ? t('users.modals.stats.lessons.badges.quiz.passedScore', { score: lesson.quiz_score })
          : t('users.modals.stats.lessons.badges.quiz.passedNoScore')}
      </Badge>
    );
  }

  return (
    <Badge color={theme.dangerColor} bg={`${theme.dangerColor}20`}>
      <XCircle className="w-2.5 h-2.5" />
      {lesson.quiz_score !== null
        ? t('users.modals.stats.lessons.badges.quiz.failedScore', { score: lesson.quiz_score })
        : t('users.modals.stats.lessons.badges.quiz.failedNoScore')}
    </Badge>
  );
}

function Badge({ bg, children, color, dimmed }: { bg: string; children: React.ReactNode; color: string; dimmed?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${dimmed ? 'opacity-40' : ''}`} style={{ backgroundColor: bg, color }}>
      {children}
    </span>
  );
}
