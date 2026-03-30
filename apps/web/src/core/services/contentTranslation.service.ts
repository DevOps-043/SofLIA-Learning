import { SupportedLanguage } from '../i18n/i18n';
import { createClient } from '@/lib/supabase/client';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Servicio para manejar traducciones de contenido dinámico desde la base de datos
 * Usa la tabla content_translations con JSONB
 */

type EntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material';

interface ContentTranslations {
  [key: string]: string | string[]; // Cualquier campo traducido (soporta strings y arrays)
}

export class ContentTranslationService {
  private static cache: Map<string, ContentTranslations> = new Map();

  /**
   * Genera clave de caché
   */
  private static getCacheKey(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage
  ): string {
    return `${entityType}:${entityId}:${language}`;
  }

  /**
   * Obtiene las traducciones de una entidad desde la BD
   * @param supabaseClient Cliente opcional de Supabase (para uso en servidor)
   * 
   * IMPORTANTE: Ahora siempre intenta cargar traducciones, incluso para español.
   * Esto es necesario porque cuando el contenido original está en inglés o portugués,
   * necesitamos cargar la traducción al español desde content_translations.
   */
  static async loadTranslations(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage,
    supabaseClient?: any
  ): Promise<ContentTranslations> {
    // IMPORTANTE: Ya no retornamos vacío para español
    // Si el contenido original está en inglés/portugués, necesitamos la traducción a español

    // Verificar caché
    const cacheKey = this.getCacheKey(entityType, entityId, language);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Usar el cliente proporcionado (servidor) o crear uno nuevo (cliente)
      // IMPORTANTE: No importar createServerClient directamente aquí porque tiene 'server-only'
      // En su lugar, siempre usar createClient del cliente, o pasar el cliente del servidor como parámetro
      const supabase = supabaseClient || createClient();
      
      const { data, error } = await supabase
        .from('content_translations')
        .select('translations')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('language_code', language)
        .single();

      if (error || !data) {

        // No hay traducciones, guardar objeto vacío en caché
        this.cache.set(cacheKey, {});
        return {};
      }

      // Guardar en caché
      const translations = data.translations as ContentTranslations;
      this.cache.set(cacheKey, translations);
      return translations;
    } catch (error) {
      console.error(`[ContentTranslationService] ❌ Error loading translations for ${entityType}:${entityId}:`, error);
      return {};
    }
  }

  /**
   * Obtiene la traducción de un campo específico
   * IMPORTANTE: Ahora intenta traducir incluso cuando language === 'es'
   * porque el contenido original puede estar en inglés/portugués
   */
  static async getTranslation(
    entityType: EntityType,
    entityId: string,
    field: string,
    language: SupportedLanguage,
    fallback: string
  ): Promise<string> {
    // Siempre intentar cargar traducciones, incluso para español
    const translations = await this.loadTranslations(entityType, entityId, language);
    return translations[field] || fallback;
  }

  /**
   * Traduce un objeto completo
   * IMPORTANTE: Ahora intenta traducir incluso cuando language === 'es'
   * porque el contenido original puede estar en inglés/portugués
   * @param supabaseClient Cliente opcional de Supabase (para uso en servidor)
   */
  static async translateObject<T extends Record<string, any>>(
    entityType: EntityType,
    obj: T,
    fields: string[],
    language: SupportedLanguage,
    supabaseClient?: any
  ): Promise<T> {
    if (!obj.id) {
      return obj;
    }

    // Siempre intentar cargar traducciones, incluso para español
    const translations = await this.loadTranslations(entityType, obj.id, language, supabaseClient);

    // Si no hay traducciones, retornar objeto original
    if (Object.keys(translations).length === 0) {
      return obj;
    }

    // Aplicar traducciones
    const translated = { ...obj } as any;
    fields.forEach(field => {
      if (translations[field]) {
        translated[field] = translations[field];
      }
    });

    return translated;
  }

  /**
   * Traduce un array de objetos (batch)
   * @param supabaseClient Cliente opcional de Supabase (para uso en servidor)
   */
  static async translateArray<T extends Record<string, any>>(
    entityType: EntityType,
    array: T[],
    fields: string[],
    language: SupportedLanguage,
    supabaseClient?: any
  ): Promise<T[]> {
    // IMPORTANTE: Ya no retornamos el array original para español
    // Si el contenido original está en inglés/portugués, necesitamos traducir a español
    if (array.length === 0) {
      return array;
    }

    try {
      // Obtener todos los IDs
      const entityIds = array.map(item => item.id).filter(Boolean);

      if (entityIds.length === 0) {
        return array;
      }

      // Usar el cliente proporcionado (servidor) o crear uno nuevo (cliente)
      // IMPORTANTE: No importar createServerClient directamente aquí porque tiene 'server-only'
      // En su lugar, siempre usar createClient del cliente, o pasar el cliente del servidor como parámetro
      const supabase = supabaseClient || createClient();
      const { data, error } = await supabase
        .from('content_translations')
        .select('entity_id, translations')
        .eq('entity_type', entityType)
        .eq('language_code', language)
        .in('entity_id', entityIds);

      if (error || !data) {
        console.warn('[translateArray] No translations found or error:', error);
        return array;
      }

      // Crear mapa de traducciones
      const translationsMap = new Map<string, ContentTranslations>();
      data.forEach((item: any) => {
        translationsMap.set(item.entity_id, item.translations as ContentTranslations);
        // Guardar en caché
        const cacheKey = this.getCacheKey(entityType, item.entity_id, language);
        this.cache.set(cacheKey, item.translations as ContentTranslations);
      });

      // Aplicar traducciones
      return array.map(item => {
        if (!item.id) {

          return item;
        }
        
        const translations = translationsMap.get(item.id);
        if (!translations) {
          return item;
        }

        const translated = { ...item } as any;
        fields.forEach(field => {
          if (translations[field]) {
            const originalValue = translated[field];
            translated[field] = translations[field];

          }
        });
        return translated;
      });
    } catch (error) {
      console.error('Error translating array:', error);
      return array;
    }
  }

  /**
   * Guarda o actualiza una traducción (para admin)
   * @param supabaseClient - Cliente de Supabase opcional (para uso en servidor)
   */
  static async saveTranslation(
    entityType: EntityType,
    entityId: string,
    language: SupportedLanguage,
    translations: ContentTranslations,
    userId?: string,
    supabaseClient?: any // Cliente de Supabase opcional (para uso en servidor)
  ): Promise<boolean> {
    // IMPORTANTE: Ahora guardamos traducciones a TODOS los idiomas, incluyendo español
    // La lógica de "no traducir a español" se maneja en las funciones de traducción
    // cuando el contenido original ya está en español. Pero si el contenido original
    // está en inglés o portugués, SÍ necesitamos guardar la traducción a español.

    try {
      // Validar que tenemos traducciones para guardar
      if (!translations || Object.keys(translations).length === 0) {
        console.warn(`[ContentTranslationService] ⚠️ No hay traducciones para guardar para ${entityType}:${entityId}:${language}`);
        return false;
      }

      // Verificar tamaño total de las traducciones (Supabase tiene límites)
      const translationsJson = JSON.stringify(translations);
      const translationsSize = new Blob([translationsJson]).size;

      // Supabase JSONB tiene un límite de ~1GB, pero en la práctica es mejor mantenerlo bajo
      if (translationsSize > 10 * 1024 * 1024) { // 10MB
        console.warn(`[ContentTranslationService] ⚠️ Traducciones muy grandes (${(translationsSize / (1024 * 1024)).toFixed(2)}MB) para ${entityType}:${entityId}:${language}`);
      }


      // IMPORTANTE: Siempre usar SERVICE_ROLE_KEY para guardar traducciones
      // Esto bypassa RLS y permite escribir independientemente de los permisos del usuario

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[ContentTranslationService] ❌ No se puede crear cliente: faltan variables de entorno');
        console.error('[ContentTranslationService] Requerido:', {
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          supabaseUrl: supabaseUrl ? '✅' : '❌',
          serviceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 7)}...` : '❌'
        });
        return false;
      }
      
      const supabase = createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const upsertData = {
        entity_type: entityType,
        entity_id: entityId,
        language_code: language,
        translations: translations,
        created_by: userId || null,
        updated_at: new Date().toISOString()
      };


      
      const { data, error } = await supabase
        .from('content_translations')
        .upsert(upsertData, {
          onConflict: 'entity_type,entity_id,language_code'
        })
        .select();

      if (error) {
        console.error(`[ContentTranslationService] ❌ Error guardando traducción para ${entityType}:${entityId}:${language}:`, error);
        console.error(`[ContentTranslationService] Detalles del error:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error(`[ContentTranslationService] Stack completo del error:`, JSON.stringify(error, null, 2));
        return false;
      }

      // Limpiar caché
      const cacheKey = this.getCacheKey(entityType, entityId, language);
      this.cache.delete(cacheKey);

      return true;
    } catch (error) {
      console.error(`[ContentTranslationService] ❌ Excepción al guardar traducción para ${entityType}:${entityId}:${language}:`, error);
      if (error instanceof Error) {
        console.error(`[ContentTranslationService] Stack trace:`, error.stack);
      }
      return false;
    }
  }

  /**
   * Limpia el caché de traducciones
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
