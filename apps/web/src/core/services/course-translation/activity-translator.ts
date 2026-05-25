import { translateAndSaveEntity } from './translation-runner';
import { compactTexts, fieldsWithOptional } from './translation-utils';
import type { TranslationResult } from './types';

interface ActivityTranslationData {
  activity_title: string;
  activity_description?: string | null;
  activity_content?: string | null;
  ai_prompts?: string | null;
}

export async function translateActivityOnCreate(
  activityId: string,
  activityData: ActivityTranslationData,
  userId?: string
): Promise<TranslationResult> {
  return translateAndSaveEntity({
    entityId: activityId,
    entityType: 'activity',
    entityLabel: 'actividad',
    data: { ...activityData },
    fields: fieldsWithOptional(['activity_title'], {
      activity_description: activityData.activity_description,
      activity_content: activityData.activity_content,
      ai_prompts: activityData.ai_prompts,
    }),
    textsToAnalyze: compactTexts([
      activityData.activity_title,
      activityData.activity_description,
      activityData.activity_content?.slice(0, 200),
    ]),
    context: 'Esta es una actividad practica de un curso educativo.',
    userId,
  });
}
