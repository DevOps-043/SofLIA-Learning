export interface LessonItem {
  courseTitle: string;
  lessonTitle: string;
  lessonOrderIndex: number;
  durationMinutes: number;
  moduleTitle?: string;
}

export interface SlotDistribution {
  slot: {
    date: string;
    start: string;
    end: string;
    dayName: string;
    durationMinutes: number;
  };
  lessons: LessonItem[];
}

export interface InsertEventsRequest {
  lessonDistribution: SlotDistribution[];
  timezone: string;
  planName?: string;
}

export interface EventToInsert {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export function buildEventsToInsert(
  lessonDistribution: SlotDistribution[],
  timezone: string | undefined,
  planName?: string,
): EventToInsert[] {
  return lessonDistribution.map(({ slot, lessons }) => {
    const lessonTitles = lessons.map((lesson) => lesson.lessonTitle).join(' | ');
    const courseTitle = lessons[0]?.courseTitle || 'Curso';
    const title = `ðŸ“š ${courseTitle}: ${lessonTitles}`;

    return {
      title: title.length > 200 ? `${title.substring(0, 197)}...` : title,
      description: createEventDescription(lessons, planName),
      startTime: slot.start,
      endTime: slot.end,
      timezone: timezone || 'America/Mexico_City',
    };
  });
}

function createEventDescription(lessons: LessonItem[], planName?: string): string {
  const lines: string[] = [];

  if (planName) {
    lines.push(`ðŸ“– Plan: ${planName}`);
    lines.push('');
  }

  lines.push('ðŸ“š Lecciones en esta sesiÃ³n:');

  for (const lesson of lessons) {
    const moduleInfo = lesson.moduleTitle ? ` (${lesson.moduleTitle})` : '';
    lines.push(`â€¢ ${lesson.lessonTitle}${moduleInfo} - ${lesson.durationMinutes} min`);
  }

  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  lines.push('');
  lines.push(`â±ï¸ DuraciÃ³n total: ${totalDuration} minutos`);
  lines.push('');
  lines.push('---');
  lines.push('Creado automÃ¡ticamente por SofLIA - Planificador de Estudios');

  return lines.join('\n');
}
