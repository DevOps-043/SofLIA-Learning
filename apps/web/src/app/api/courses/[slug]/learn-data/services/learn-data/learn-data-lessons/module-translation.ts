import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import type { SupportedLanguage } from '@/core/i18n/i18n'
import type { ModuleRow, SupabaseServerClient } from './types'

export async function translateModulesForLearnData(
  supabase: SupabaseServerClient,
  modules: ModuleRow[],
  language: string,
) {
  const translatedModules = await ContentTranslationService.translateArray(
    'module',
    modules.map((module) => ({ ...module, id: module.module_id })),
    ['module_title', 'module_description'],
    language as SupportedLanguage,
    supabase,
  )

  return new Map(
    translatedModules.map((module) => [module.module_id, module]),
  )
}
