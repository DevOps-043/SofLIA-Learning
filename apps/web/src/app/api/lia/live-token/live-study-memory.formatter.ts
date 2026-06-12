export interface LiveLessonNote {
  contentPreview: string;
  courseTitle: string | null;
  lessonTitle: string | null;
  moduleTitle: string | null;
  sourceType: string | null;
  title: string;
  updatedAt: string | null;
}

function formatLocation(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' > ');
}

export function formatLiaLiveStudyMemorySection(params: {
  notes: LiveLessonNote[];
}): string {
  const { notes } = params;
  if (notes.length === 0) return '';

  const lines = [
    '### Memoria academica reciente del usuario (verificada)',
    'Usa estas notas solo como contexto de aprendizaje del usuario.',
    'No las menciones como "memoria oculta" ni como datos tecnicos. Si el usuario pregunta por algo que no este aqui ni en los cursos/progreso verificados, no lo inventes.',
  ];

  lines.push('', 'Notas recientes del usuario:');
  notes.forEach((note, index) => {
    const location = formatLocation([note.courseTitle, note.moduleTitle, note.lessonTitle]);
    const source = note.sourceType ? `; fuente: ${note.sourceType}` : '';
    const updated = note.updatedAt ? `; actualizado: ${note.updatedAt}` : '';
    lines.push(
      `${index + 1}. ${note.title}${location ? ` (${location})` : ''}${source}${updated}: ${note.contentPreview}`,
    );
  });

  return lines.join('\n');
}
