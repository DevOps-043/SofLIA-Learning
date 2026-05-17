import { translateAndSaveEntity } from './translation-runner';
import { compactTexts, fieldsWithOptional } from './translation-utils';
import type { TranslationResult } from './types';

interface MaterialTranslationData {
  material_title: string;
  material_description?: string | null;
  content_data?: Record<string, unknown>;
}

export async function translateMaterialOnCreate(
  materialId: string,
  materialData: MaterialTranslationData,
  userId?: string
): Promise<TranslationResult> {
  return translateAndSaveEntity({
    entityId: materialId,
    entityType: 'material',
    entityLabel: 'material',
    data: { ...materialData },
    fields: fieldsWithOptional(['material_title'], {
      material_description: materialData.material_description,
    }),
    textsToAnalyze: compactTexts([materialData.material_title, materialData.material_description]),
    context: 'Este es un material educativo complementario de un curso sobre inteligencia artificial.',
    userId,
  });
}
