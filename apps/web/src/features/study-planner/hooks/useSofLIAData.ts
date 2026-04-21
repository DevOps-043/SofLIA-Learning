/**
 * useSofLIAData Hook
 * 
 * Hook simplificado para obtener datos del contexto de SofLIA.
 * Puede usarse independientemente del SofLIAProvider si es necesario.
 * 
 * Este hook:
 * 1. Carga las lecciones pendientes directamente de la BD
 * 2. Proporciona un ref para acceso síncrono a las lecciones
 * 3. Genera contexto estructurado para el prompt
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  CourseData,
  CourseDataResponse,
  LessonData,
  LessonDataResponse,
  SofLIADataState,
} from './useSofLIAData.types';
export type { CourseData, LessonData, SofLIADataState } from './useSofLIAData.types';

// ============================================================================
// HOOK
// ============================================================================

export function useSofLIAData() {
  const [state, setState] = useState<SofLIADataState>({
    lessons: [],
    courses: [],
    totalPending: 0,
    isLoading: false,
    isReady: false,
    error: null,
  });

  // Ref para acceso síncrono (para callbacks y efectos)
  const lessonsRef = useRef<LessonData[]>([]);
  const loadedRef = useRef(false);

  // -------------------------------------------------------------------------
  // Cargar lecciones pendientes desde la BD
  // -------------------------------------------------------------------------
  const loadPendingLessons = useCallback(async () => {
    // Evitar cargar múltiples veces
    if (loadedRef.current && lessonsRef.current.length > 0) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/study-planner/pending-lessons');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      // Mapear lecciones
      const lessons: LessonData[] = ((data.allPendingLessons || []) as LessonDataResponse[]).map((l) => ({
        lessonId: l.lessonId,
        lessonTitle: l.lessonTitle, // ⚠️ NOMBRE EXACTO DE LA BD
        lessonOrderIndex: l.lessonOrderIndex || 0,
        durationMinutes: l.durationMinutes || 15,
        moduleId: l.moduleId || '',
        moduleTitle: l.moduleTitle || '',
        moduleOrderIndex: l.moduleOrderIndex || 0,
        courseId: l.courseId || '',
        courseTitle: l.courseTitle || '',
      }));

      // Mapear cursos
      const courses: CourseData[] = ((data.courses || []) as CourseDataResponse[]).map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        dueDate: c.dueDate || null,
        totalLessons: c.totalLessons || 0,
        completedLessons: c.completedLessons || 0,
        pendingCount: c.pendingCount || 0,
      }));

      // Actualizar ref y estado
      lessonsRef.current = lessons;
      loadedRef.current = true;

      setState({
        lessons,
        courses,
        totalPending: data.totalPendingLessons || lessons.length,
        isLoading: false,
        isReady: true,
        error: null,
      });

    } catch (error) {
      console.error('❌ [useSofLIAData] Error cargando lecciones:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, []);

  /**
   * Generates a formatted lesson list for the AI prompt.
   *
   * @param selectedCourseIds - When provided, only lessons from these courses
   *   are included. This is critical for single-course planning (RF-01) to
   *   prevent the AI from hallucinating lessons from unselected courses.
   */
  const getLessonsForPrompt = useCallback((selectedCourseIds?: string[]): string => {
    const allLessons = lessonsRef.current;

    if (allLessons.length === 0) {
      return 'No hay lecciones pendientes definidas aún.';
    }

    // Filter by selected courses when provided
    const filteredLessons = selectedCourseIds && selectedCourseIds.length > 0
      ? allLessons.filter(l => selectedCourseIds.includes(l.courseId))
      : allLessons;

    if (filteredLessons.length === 0) {
      return 'No hay lecciones pendientes para el curso seleccionado.';
    }

    return filteredLessons
      .map(l => `- ${l.lessonTitle} (${l.durationMinutes} min) - Módulo: ${l.moduleTitle}`)
      .join('\n');
  }, []);

  // -------------------------------------------------------------------------
  // Generar contexto completo para el prompt
  // -------------------------------------------------------------------------
  const getContextForPrompt = useCallback((): string => {
    const { lessons, courses, totalPending } = state;

    if (lessons.length === 0 && courses.length === 0) {
      return 'No hay datos de lecciones disponibles.';
    }

    let context = '';

    // Cursos con fechas límite
    if (courses.length > 0) {
      context += `CURSOS ASIGNADOS (${courses.length}):\n`;
      for (const course of courses) {
        context += `- ${course.courseTitle}`;
        if (course.dueDate) {
          const daysRemaining = Math.ceil(
            (new Date(course.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          context += ` [Fecha límite: ${daysRemaining} días]`;
        }
        context += ` (${course.completedLessons}/${course.totalLessons} completadas, ${course.pendingCount} pendientes)\n`;
      }
      context += '\n';
    }

    // Lecciones pendientes
    context += `LECCIONES PENDIENTES (${totalPending} total):\n`;
    context += `⚠️ IMPORTANTE: Usa SOLO estas lecciones con sus nombres y duraciones EXACTAS.\n`;
    context += `⛔ PROHIBIDO inventar lecciones que no estén en esta lista.\n\n`;
    
    for (const lesson of lessons) {
      context += `- ${lesson.lessonTitle} (${lesson.durationMinutes} min) - ${lesson.moduleTitle}\n`;
    }

    return context;
  }, [state]);

  // -------------------------------------------------------------------------
  // Forzar recarga
  // -------------------------------------------------------------------------
  const forceReload = useCallback(async () => {
    loadedRef.current = false;
    lessonsRef.current = [];
    await loadPendingLessons();
  }, [loadPendingLessons]);

  return {
    // Estado
    ...state,
    
    // Refs para acceso síncrono
    lessonsRef,
    
    // Acciones
    loadPendingLessons,
    forceReload,
    
    // Helpers para prompts
    getLessonsForPrompt,
    getContextForPrompt,
  };
}

export default useSofLIAData;
