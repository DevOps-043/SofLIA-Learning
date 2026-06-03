import { translateAndSaveEntity } from './translation-runner';
import { compactTexts, fieldsWithOptional } from './translation-utils';
import type { ServerSupabaseClient, TranslationResult } from './types';

interface CourseTranslationData {
  title: string;
  description?: string | null;
  learning_objectives?: string[] | null;
}

export async function translateCourseOnCreate(
  courseId: string,
  courseData: CourseTranslationData,
  userId?: string,
  supabaseClient?: ServerSupabaseClient
): Promise<TranslationResult> {
  return translateAndSaveEntity({
    entityId: courseId,
    entityType: 'course',
    entityLabel: 'curso',
    data: { ...courseData },
    fields: fieldsWithOptional(['title'], {
      description: courseData.description,
      learning_objectives: Array.isArray(courseData.learning_objectives),
    }),
    textsToAnalyze: compactTexts([courseData.title, courseData.description]),
    context: 'Este es un curso de una plataforma educativa sobre inteligencia artificial aplicada.',
    userId,
    supabaseClient,
    requireGeminiKey: true,
  });
}
