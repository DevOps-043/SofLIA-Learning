import type React from 'react';
import { Clock, MessageCircle, StickyNote } from 'lucide-react';
import { fmtMinutes } from './format';
import type { LessonBadgeProps } from './types';

export function LiasBadge({ lesson, theme, t }: LessonBadgeProps) {
  if (lesson.lia_conversations === 0) {
    return (
      <Badge color={theme.textColor} bg={`color-mix(in srgb, ${theme.textColor} 6.3%, transparent)`} dimmed>
        <MessageCircle className="w-2.5 h-2.5" />
        {t('users.modals.stats.lessons.badges.lia.empty')}
      </Badge>
    );
  }

  return (
    <Badge color={theme.accentColor} bg={`color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)`}>
      <MessageCircle className="w-2.5 h-2.5" />
      {t('users.modals.stats.lessons.badges.lia.count', { count: lesson.lia_conversations })}
    </Badge>
  );
}

export function NotesBadge({ lesson, theme, t }: LessonBadgeProps) {
  if (lesson.notes_count === 0) {
    return (
      <Badge color={theme.textColor} bg={`color-mix(in srgb, ${theme.textColor} 6.3%, transparent)`} dimmed>
        <StickyNote className="w-2.5 h-2.5" />
        {t('users.modals.stats.lessons.badges.notes.empty')}
      </Badge>
    );
  }

  const notesKey =
    lesson.notes_count === 1
      ? 'users.modals.stats.lessons.badges.notes.countSingular'
      : 'users.modals.stats.lessons.badges.notes.countPlural';

  return (
    <Badge color={theme.primaryColor} bg={`color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)`}>
      <StickyNote className="w-2.5 h-2.5" />
      {t(notesKey, { count: lesson.notes_count })}
    </Badge>
  );
}

export function TimeSpentBadge({ lesson, theme }: LessonBadgeProps) {
  if (lesson.time_spent_minutes <= 0) {
    return null;
  }

  return (
    <Badge color={theme.textColor} bg={`color-mix(in srgb, ${theme.textColor} 6.3%, transparent)`} dimmed={false} className="opacity-50">
      <Clock className="w-2.5 h-2.5" />
      {fmtMinutes(lesson.time_spent_minutes)}
    </Badge>
  );
}

function Badge({
  bg,
  children,
  className = '',
  color,
  dimmed
}: {
  bg: string;
  children: React.ReactNode;
  className?: string;
  color: string;
  dimmed?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${dimmed ? 'opacity-40' : ''} ${className}`} style={{ backgroundColor: bg, color }}>
      {children}
    </span>
  );
}
