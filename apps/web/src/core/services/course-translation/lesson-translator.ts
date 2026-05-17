import { translateAndSaveEntity } from './translation-runner';
import { compactTexts, fieldsWithOptional } from './translation-utils';
import type { TranslationResult } from './types';

interface LessonTranslationData {
  lesson_title: string;
  lesson_description?: string | null;
  transcript_content?: string | null;
  summary_content?: string | null;
}

function getLessonAnalysisTexts(lessonData: LessonTranslationData): string[] {
  const fallback = lessonData.transcript_content?.slice(0, 200) || lessonData.summary_content?.slice(0, 200);
  return compactTexts([lessonData.lesson_title, lessonData.lesson_description, fallback]);
}

export async function translateLessonOnCreate(
  lessonId: string,
  lessonData: LessonTranslationData,
  userId?: string
): Promise<TranslationResult> {
  return translateAndSaveEntity({
    entityId: lessonId,
    entityType: 'lesson',
    entityLabel: 'leccion',
    data: { ...lessonData },
    fields: fieldsWithOptional(['lesson_title'], {
      lesson_description: lessonData.lesson_description,
      transcript_content: lessonData.transcript_content,
      summary_content: lessonData.summary_content,
    }),
    textsToAnalyze: getLessonAnalysisTexts(lessonData),
    context: 'Este es el contenido de una leccion educativa sobre inteligencia artificial.',
    userId,
  });
}
