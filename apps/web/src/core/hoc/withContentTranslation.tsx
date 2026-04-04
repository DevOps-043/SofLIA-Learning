import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../providers/I18nProvider';
import { ContentTranslationService } from '../services/contentTranslation.service';

/**
 * Hook que traduce automáticamente un array de entidades desde la BD
 */
export function useTranslatedContent<T extends Record<string, unknown>>(
  entityType: 'course' | 'module' | 'lesson',
  data: T[] | null | undefined,
  fields: string[]
): T[] {
  const { language } = useLanguage();
  const [translatedData, setTranslatedData] = useState<T[]>([]);

  // Crear una clave estable para los datos
  const dataKey = useMemo(() => {
    if (!data || data.length === 0) return 'empty';
    return data.map(item => item.id).join(',');
  }, [data]);

  useEffect(() => {
    // Si no hay datos, establecer array vacío
    if (!data || data.length === 0) {
      setTranslatedData([]);
      return;
    }

    // IMPORTANTE: Ahora siempre intentamos traducir, incluso para español
    // Si el contenido original está en inglés/portugués, necesitamos la traducción a español
    let isCancelled = false;

    const translateData = async () => {
      try {

        const translated = await ContentTranslationService.translateArray(
          entityType,
          data,
          fields,
          language
        );

        if (!isCancelled) {
          setTranslatedData(translated);
        }
      } catch (error) {
        console.error('Error translating content:', error);
        if (!isCancelled) {
          setTranslatedData(data); // Usar datos originales en caso de error
        }
      }
    };

    translateData();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [dataKey, language, entityType]); // Removemos 'data' y 'fields' para evitar loops

  return translatedData;
}

/**
 * Hook que traduce automáticamente un objeto desde la BD
 */
export function useTranslatedObject<T extends Record<string, unknown>>(
  entityType: 'course' | 'module' | 'lesson',
  data: T | null | undefined,
  fields: string[]
): T | null {
  const { language } = useLanguage();
  const [translatedData, setTranslatedData] = useState<T | null>(null);

  // Crear clave estable para el objeto
  const dataKey = useMemo(() => {
    return data?.id || 'empty';
  }, [data?.id]);

  useEffect(() => {
    if (!data) {
      setTranslatedData(null);
      return;
    }

    // IMPORTANTE: Ahora siempre intentamos traducir, incluso para español
    // Si el contenido original está en inglés/portugués, necesitamos la traducción a español
    let isCancelled = false;

    const translateData = async () => {
      try {
        const translated = await ContentTranslationService.translateObject(
          entityType,
          data,
          fields,
          language
        );
        if (!isCancelled) {
          setTranslatedData(translated);
        }
      } catch (error) {
        console.error('Error translating object:', error);
        if (!isCancelled) {
          setTranslatedData(data);
        }
      }
    };

    translateData();

    return () => {
      isCancelled = true;
    };
  }, [dataKey, language, entityType]);

  return translatedData;
}
