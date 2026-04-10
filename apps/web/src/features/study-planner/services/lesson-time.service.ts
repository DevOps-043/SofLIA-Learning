/**
 * Lesson Time Service
 * Calcula y obtiene los tiempos de las lecciones para el planificador
 */

import { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface CourseModuleRow {
  module_id: string | null;
  module_title: string | null;
}

type CourseModuleRelation = CourseModuleRow | CourseModuleRow[] | null;

interface LessonRelationRow {
  lesson_id: string;
  lesson_title: string | null;
  module_id: string | null;
  course_modules: CourseModuleRelation;
}

type LessonRelation = LessonRelationRow | LessonRelationRow[] | null;

interface LessonTimeEstimateRow {
  lesson_id: string;
  video_minutes: number | null;
  activities_time_minutes: number | null;
  reading_time_minutes: number | null;
  interactions_time_minutes: number | null;
  quiz_time_minutes: number | null;
  total_time_minutes: number | null;
  course_lessons: LessonRelation;
}

interface CourseLessonRow {
  lesson_id: string;
  lesson_title: string | null;
  duration_seconds: number | null;
  module_id: string | null;
  course_modules: CourseModuleRelation;
}

interface EstimatedTimeRow {
  estimated_time_minutes: number | null;
}

function getRelationRecord<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) {
    return relation[0] || null;
  }

  return relation || null;
}

function sumEstimatedMinutes(items: EstimatedTimeRow[] | null | undefined): number {
  return items?.reduce((sum, item) => sum + (item.estimated_time_minutes || 5), 0) || 0;
}

// Tipos para tiempos de lecciones
export interface LessonTimeEstimate {
  lessonId: string;
  lessonTitle: string;
  moduleId: string | null;
  moduleName: string | null;
  videoMinutes: number;
  activitiesMinutes: number;
  materialsMinutes: number;
  interactionsMinutes: number;
  totalMinutes: number;
}

export interface CourseTimeEstimate {
  courseId: string;
  courseTitle: string;
  lessons: LessonTimeEstimate[];
  totalMinutes: number;
  averageLessonMinutes: number;
  minLessonMinutes: number;
  maxLessonMinutes: number;
  lessonCount: number;
}

export interface CoursesTimeAnalysis {
  courses: CourseTimeEstimate[];
  totalMinutes: number;
  totalLessons: number;
  globalMinLessonMinutes: number;
  globalMaxLessonMinutes: number;
  globalAverageLessonMinutes: number;
  recommendedMinSessionMinutes: number;
}

export class LessonTimeService {
  // Tiempo fijo de interacciones (navegación, comprensión)
  private static readonly INTERACTION_TIME_MINUTES = 3;

  /**
   * Obtiene la duración de una lección (tiempo base sin modificar)
   * @param lessonTotalMinutes - Tiempo total de la lección (video + materiales + actividades)
   * @returns Duración de la lección en minutos
   */
  static getLessonDuration(lessonTotalMinutes: number): number {
    return Math.ceil(lessonTotalMinutes);
  }

  /**
   * Calcula la duración total de múltiples lecciones
   * @param lessons - Array de lecciones con sus tiempos
   * @returns Duración total de todas las lecciones
   */
  static getTotalLessonsDuration(lessons: { totalMinutes: number }[]): number {
    return lessons.reduce((total, lesson) => {
      return total + Math.ceil(lesson.totalMinutes);
    }, 0);
  }

  /**
   * Obtiene los tiempos estimados para un curso específico
   */
  static async getCourseTimeEstimate(courseId: string): Promise<CourseTimeEstimate | null> {
    const supabase = await createClient();

    // Obtener información del curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return null;
    }

    // Obtener lecciones del curso con sus tiempos
    const lessons = await this.getCourseLessonsTime(courseId, supabase);

    if (lessons.length === 0) {
      return {
        courseId: course.id,
        courseTitle: course.title,
        lessons: [],
        totalMinutes: 0,
        averageLessonMinutes: 0,
        minLessonMinutes: 0,
        maxLessonMinutes: 0,
        lessonCount: 0
      };
    }

    const totalMinutes = lessons.reduce((sum, l) => sum + l.totalMinutes, 0);
    const lessonTimes = lessons.map(l => l.totalMinutes);

    return {
      courseId: course.id,
      courseTitle: course.title,
      lessons,
      totalMinutes,
      averageLessonMinutes: Math.round(totalMinutes / lessons.length),
      minLessonMinutes: Math.min(...lessonTimes),
      maxLessonMinutes: Math.max(...lessonTimes),
      lessonCount: lessons.length
    };
  }

  /**
   * Obtiene los tiempos de todas las lecciones de un curso
   */
  private static async getCourseLessonsTime(
    courseId: string,
    supabase: SupabaseServerClient,
  ): Promise<LessonTimeEstimate[]> {
    // Calculamos en tiempo real para asegurar que el "fallback" dinámico de 5 minutos
    // por cada material sin tiempo aplique correctamente.
    return this.calculateLessonsTimeRealtime(courseId, supabase);
  }

  /**
   * Calcula los tiempos de lecciones en tiempo real (fallback)
   */
  private static async calculateLessonsTimeRealtime(
    courseId: string,
    supabase: SupabaseServerClient,
  ): Promise<LessonTimeEstimate[]> {
    // Obtener lecciones del curso
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        lesson_title,
        duration_seconds,
        module_id,
        course_modules (
          module_id,
          module_title
        )
      `)
      .eq('course_id', courseId)
      .order('lesson_order', { ascending: true });

    if (!lessons || lessons.length === 0) return [];

    const lessonEstimates: LessonTimeEstimate[] = [];

    const lessonIds = lessons.map(l => l.lesson_id);

    // Consultas masivas para reducir latencia
    const [activitiesResult, materialsResult] = await Promise.all([
      supabase.from('lesson_activities').select('lesson_id, estimated_time_minutes').in('lesson_id', lessonIds),
      supabase.from('lesson_materials').select('lesson_id, estimated_time_minutes').in('lesson_id', lessonIds)
    ]);

    const actsByGrp = new Map<string, EstimatedTimeRow[]>();
    const matsByGrp = new Map<string, EstimatedTimeRow[]>();

    (activitiesResult.data || []).forEach((act: any) => {
      const arr = actsByGrp.get(act.lesson_id) || [];
      arr.push({ estimated_time_minutes: act.estimated_time_minutes });
      actsByGrp.set(act.lesson_id, arr);
    });

    (materialsResult.data || []).forEach((mat: any) => {
      const arr = matsByGrp.get(mat.lesson_id) || [];
      arr.push({ estimated_time_minutes: mat.estimated_time_minutes });
      matsByGrp.set(mat.lesson_id, arr);
    });

    for (const lesson of lessons) {
      const activities = actsByGrp.get(lesson.lesson_id) || [];
      const materials = matsByGrp.get(lesson.lesson_id) || [];

      // Calcular tiempos con fallback dinámico para los nulos
      const videoMinutes = Math.ceil((lesson.duration_seconds || 0) / 60);
      const activitiesMinutes = sumEstimatedMinutes(activities);
      const materialsMinutes = sumEstimatedMinutes(materials);
      const interactionsMinutes = this.INTERACTION_TIME_MINUTES;

      const totalMinutes = videoMinutes + activitiesMinutes + materialsMinutes + interactionsMinutes;

      lessonEstimates.push({
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title || 'Sin título',
        moduleId: lesson.module_id,
        moduleName: lesson.course_modules?.module_title || null,
        videoMinutes,
        activitiesMinutes,
        materialsMinutes,
        interactionsMinutes,
        totalMinutes
      });
    }

    return lessonEstimates;
  }

  /**
   * Analiza los tiempos de múltiples cursos
   */
  static async analyzeCoursesTime(courseIds: string[]): Promise<CoursesTimeAnalysis> {
    const courses: CourseTimeEstimate[] = [];
    let totalMinutes = 0;
    let totalLessons = 0;
    let allLessonMinutes: number[] = [];

    for (const courseId of courseIds) {
      const courseEstimate = await this.getCourseTimeEstimate(courseId);
      if (courseEstimate) {
        courses.push(courseEstimate);
        totalMinutes += courseEstimate.totalMinutes;
        totalLessons += courseEstimate.lessonCount;
        allLessonMinutes.push(...courseEstimate.lessons.map(l => l.totalMinutes));
      }
    }

    // Calcular estadísticas globales
    const globalMinLessonMinutes = allLessonMinutes.length > 0 ? Math.min(...allLessonMinutes) : 0;
    const globalMaxLessonMinutes = allLessonMinutes.length > 0 ? Math.max(...allLessonMinutes) : 0;
    const globalAverageLessonMinutes = totalLessons > 0 ? Math.round(totalMinutes / totalLessons) : 0;

    // El tiempo mínimo de sesión debe permitir completar al menos una lección
    // Usamos el tiempo máximo de lección para asegurar que cualquier lección pueda completarse
    const recommendedMinSessionMinutes = globalMaxLessonMinutes > 0
      ? globalMaxLessonMinutes
      : 30; // Default de 30 minutos si no hay datos

    return {
      courses,
      totalMinutes,
      totalLessons,
      globalMinLessonMinutes,
      globalMaxLessonMinutes,
      globalAverageLessonMinutes,
      recommendedMinSessionMinutes
    };
  }

  /**
   * Verifica si un tiempo de sesión es válido para un conjunto de cursos
   */
  static async validateSessionTime(
    sessionMinutes: number,
    courseIds: string[]
  ): Promise<{ isValid: boolean; minRequired: number; message: string }> {
    const analysis = await this.analyzeCoursesTime(courseIds);

    if (analysis.totalLessons === 0) {
      return {
        isValid: true,
        minRequired: 30,
        message: 'No se encontraron lecciones en los cursos seleccionados.'
      };
    }

    // El tiempo de sesión debe ser al menos igual al tiempo máximo de lección
    // para poder completar cualquier lección del curso
    const minRequired = analysis.recommendedMinSessionMinutes;

    if (sessionMinutes < minRequired) {
      return {
        isValid: false,
        minRequired,
        message: `El tiempo mínimo de sesión debe ser de ${minRequired} minutos para poder completar las lecciones. La lección más larga dura ${analysis.globalMaxLessonMinutes} minutos.`
      };
    }

    return {
      isValid: true,
      minRequired,
      message: `Tiempo de sesión válido. Podrás completar lecciones de hasta ${analysis.globalMaxLessonMinutes} minutos.`
    };
  }

  /**
   * Estima cuántas semanas tomaría completar los cursos con una configuración dada
   */
  static estimateCompletionTime(
    totalMinutes: number,
    sessionsPerWeek: number,
    sessionDurationMinutes: number
  ): { weeks: number; estimatedEndDate: Date } {
    const weeklyStudyMinutes = sessionsPerWeek * sessionDurationMinutes;
    const weeks = Math.ceil(totalMinutes / weeklyStudyMinutes);

    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + (weeks * 7));

    return { weeks, estimatedEndDate };
  }

  /**
   * Formatea minutos a texto legible
   */
  static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }
}
