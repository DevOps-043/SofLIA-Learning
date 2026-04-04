/**
 * Utilidades para obtener metadatos de talleres dinámicamente desde la BD
 * 
 * IMPORTANTE: Estas funciones consultan la BD en tiempo real.
 * NO hay datos hardcodeados - cualquier cambio en la BD se refleja automáticamente.
 */

import { createClient } from '../supabase/server';
import type { ModuleInfo, LessonInfo } from '../../core/types/lia.types';

/**
 * Metadatos completos de un taller/curso
 */
export interface WorkshopMetadata {
  workshopId: string;
  workshopSlug: string;
  workshopTitle: string;
  workshopDescription?: string;
  modules: ModuleInfo[];
}

/**
 * Obtiene todos los metadatos de un taller dinámicamente desde la BD
 * 
 * @param workshopId - ID del taller (course_id en la tabla courses)
 * @returns Metadatos completos del taller incluyendo módulos y lecciones
 * 
 * Esta función:
 * - Consulta la BD en tiempo real (no usa datos hardcodeados)
 * - Obtiene TODOS los módulos publicados del taller
 * - Obtiene TODAS las lecciones publicadas de cada módulo
 * - Respeta el orden (module_order_index, lesson_order_index)
 * - Cualquier nuevo módulo/lección agregado a la BD aparecerá automáticamente
 */
export async function getWorkshopMetadata(workshopId: string): Promise<WorkshopMetadata | null> {
  const supabase = await createClient();

  try {
    // 1. Obtener información del taller desde courses
    const { data: workshop, error: workshopError } = await supabase
      .from('courses')
      .select('id, slug, title, description')
      .eq('id', workshopId)
      .single();

    if (workshopError || !workshop) {
      console.error('Error obteniendo taller:', workshopError);
      return null;
    }

    // 2. Obtener TODOS los módulos del taller (solo publicados)
    const { data: allModules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_description,
        module_order_index
      `)
      .eq('course_id', workshopId)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true });

    if (modulesError) {
      console.error('Error obteniendo módulos:', modulesError);
      return {
        workshopId: workshop.id,
        workshopSlug: workshop.slug || '',
        workshopTitle: workshop.title || '',
        workshopDescription: workshop.description || undefined,
        modules: []
      };
    }

    // Si no hay módulos, retornar con array vacío
    if (!allModules || allModules.length === 0) {
      return {
        workshopId: workshop.id,
        workshopSlug: workshop.slug || '',
        workshopTitle: workshop.title || '',
        workshopDescription: workshop.description || undefined,
        modules: []
      };
    }

    // 3. Obtener TODAS las lecciones de todos los módulos en una sola consulta
    const moduleIds = allModules.map(m => m.module_id);
    const { data: allLessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        lesson_title,
        lesson_description,
        lesson_order_index,
        duration_seconds,
        total_duration_minutes,
        module_id
      `)
      .in('module_id', moduleIds)
      .eq('is_published', true)
      .order('lesson_order_index', { ascending: true });

    if (lessonsError) {
      console.error('Error obteniendo lecciones:', lessonsError);
      // Retornar módulos sin lecciones en caso de error
      return {
        workshopId: workshop.id,
        workshopSlug: workshop.slug || '',
        workshopTitle: workshop.title || '',
        workshopDescription: workshop.description || undefined,
        modules: allModules.map(m => ({
          moduleId: m.module_id,
          moduleTitle: m.module_title,
          moduleDescription: m.module_description || undefined,
          moduleOrderIndex: m.module_order_index,
          lessons: []
        }))
      };
    }

    // 4. Agrupar lecciones por módulo
    const lessonsByModule = new Map<string, LessonInfo[]>();
    (allLessons || []).forEach((lesson: Record<string, unknown>) => {
      if (!lessonsByModule.has(lesson.module_id)) {
        lessonsByModule.set(lesson.module_id, []);
      }
      lessonsByModule.get(lesson.module_id)!.push({
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title,
        lessonDescription: lesson.lesson_description || undefined,
        lessonOrderIndex: lesson.lesson_order_index,
        durationSeconds: lesson.duration_seconds || undefined,
        // ✅ CORRECCIÓN: Priorizar total_duration_minutes, luego calcular desde duration_seconds, fallback a 15 min
        totalDurationMinutes: lesson.total_duration_minutes && lesson.total_duration_minutes > 0
          ? lesson.total_duration_minutes
          : (lesson.duration_seconds && lesson.duration_seconds > 0
            ? Math.ceil(lesson.duration_seconds / 60)
            : 15)
      });
    });

    // 5. Construir estructura final con módulos y sus lecciones
    const modules: ModuleInfo[] = allModules.map(module => ({
      moduleId: module.module_id,
      moduleTitle: module.module_title,
      moduleDescription: module.module_description || undefined,
      moduleOrderIndex: module.module_order_index,
      lessons: lessonsByModule.get(module.module_id) || []
    }));

    return {
      workshopId: workshop.id,
      workshopSlug: workshop.slug || '',
      workshopTitle: workshop.title || '',
      workshopDescription: workshop.description || undefined,
      modules
    };
  } catch (error) {
    console.error('Error inesperado obteniendo metadatos del taller:', error);
    return null;
  }
}

/**
 * Obtiene metadatos de un taller por slug (útil para URLs)
 * 
 * @param workshopSlug - Slug del taller
 * @returns Metadatos completos del taller
 */
export async function getWorkshopMetadataBySlug(workshopSlug: string): Promise<WorkshopMetadata | null> {
  const supabase = await createClient();

  try {
    // Primero obtener el ID del taller por slug
    const { data: workshop, error: workshopError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', workshopSlug)
      .single();

    if (workshopError || !workshop) {
      console.error('Error obteniendo taller por slug:', workshopError);
      return null;
    }

    // Luego usar la función principal con el ID
    return await getWorkshopMetadata(workshop.id);
  } catch (error) {
    console.error('Error inesperado obteniendo metadatos del taller por slug:', error);
    return null;
  }
}

