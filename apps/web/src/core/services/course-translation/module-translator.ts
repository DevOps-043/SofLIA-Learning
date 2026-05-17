import { translateAndSaveEntity } from './translation-runner';
import { compactTexts, fieldsWithOptional } from './translation-utils';
import type { TranslationResult } from './types';

interface ModuleTranslationData {
  module_title: string;
  module_description?: string | null;
}

export async function translateModuleOnCreate(
  moduleId: string,
  moduleData: ModuleTranslationData,
  userId?: string
): Promise<TranslationResult> {
  return translateAndSaveEntity({
    entityId: moduleId,
    entityType: 'module',
    entityLabel: 'modulo',
    data: { ...moduleData },
    fields: fieldsWithOptional(['module_title'], {
      module_description: moduleData.module_description,
    }),
    textsToAnalyze: compactTexts([moduleData.module_title, moduleData.module_description]),
    context: 'Este es un modulo de un curso educativo sobre inteligencia artificial.',
    userId,
  });
}
