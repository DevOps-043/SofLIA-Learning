import { useTranslation } from 'react-i18next';
import { SupportedLanguage } from '../i18n/i18n';

/**
 * Hook para traducir contenido dinámico de la base de datos
 * Usa el namespace 'content' que mapea IDs de BD a traducciones
 */
export function useContentTranslation() {
  const { t, i18n } = useTranslation('content');
  const currentLanguage = i18n.language as SupportedLanguage;

  /**
   * Traduce un campo de una entidad (curso, módulo, lección)
   * @param entityType Tipo de entidad: 'courses', 'modules', 'lessons'
   * @param entityId ID de la entidad en la base de datos
   * @param field Campo a traducir: 'title', 'description', etc.
   * @param fallbackValue Valor por defecto si no hay traducción
   */
  const translateField = (
    entityType: 'courses' | 'modules' | 'lessons',
    entityId: string,
    field: string,
    fallbackValue: string
  ): string => {
    // IMPORTANTE: Ahora siempre intentamos obtener traducción, incluso para español
    // Si el contenido original está en inglés/portugués, necesitamos la traducción a español
    const translationKey = `${entityType}.${entityId}.${field}`;
    const translation = t(translationKey, { defaultValue: '' });

    // Si no hay traducción, retornar el valor original
    return translation || fallbackValue;
  };

  /**
   * Traduce un objeto completo (curso, módulo, lección)
   * @param entityType Tipo de entidad
   * @param entity Objeto con los datos originales
   * @param fields Campos a traducir
   */
  const translateEntity = <T extends Record<string, unknown>>(
    entityType: 'courses' | 'modules' | 'lessons',
    entity: T,
    fields: string[]
  ): T => {
    // IMPORTANTE: Ahora siempre intentamos traducir, incluso para español
    // Si el contenido original está en inglés/portugués, necesitamos la traducción a español
    if (typeof entity.id !== 'string') {
      return entity;
    }

    const entityId = entity.id;
    const translated: Record<string, unknown> = { ...entity };

    fields.forEach(field => {
      const fallbackValue = entity[field];

      if (typeof fallbackValue === 'string' && fallbackValue.length > 0) {
        translated[field] = translateField(
          entityType,
          entityId,
          field,
          fallbackValue
        );
      }
    });

    return translated as T;
  };

  /**
   * Traduce un array de objetos
   * @param entityType Tipo de entidad
   * @param entities Array de objetos
   * @param fields Campos a traducir
   */
  const translateEntities = <T extends Record<string, unknown>>(
    entityType: 'courses' | 'modules' | 'lessons',
    entities: T[],
    fields: string[]
  ): T[] => {
    // IMPORTANTE: Ahora siempre intentamos traducir, incluso para español
    // Si el contenido original está en inglés/portugués, necesitamos la traducción a español
    return entities.map(entity => translateEntity(entityType, entity, fields));
  };

  return {
    translateField,
    translateEntity,
    translateEntities,
    currentLanguage,
  };
}
