import 'server-only'
import { saveTranslation } from './content-translation/save-translation';
import type {
  ContentTranslationPayload,
  EntityType,
  TranslationLanguage,
  TranslationSupabaseClient,
} from './content-translation/types';

/**
 * Servicio de ESCRITURA de traducciones de contenido.
 * server-only: usa la service role key via `createTranslationWriteClient`.
 * NUNCA importar desde Client Components — usar `ContentTranslationService`
 * (solo lectura) en su lugar.
 */
export class ContentTranslationWriteService {
  static saveTranslation(
    entityType: EntityType,
    entityId: string,
    language: TranslationLanguage,
    translations: ContentTranslationPayload,
    userId?: string,
    supabaseClient?: TranslationSupabaseClient,
  ) {
    return saveTranslation(
      entityType,
      entityId,
      language,
      translations,
      userId,
      supabaseClient,
    );
  }
}
