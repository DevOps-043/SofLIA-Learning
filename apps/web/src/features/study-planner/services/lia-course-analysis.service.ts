/**
 * lia-course-analysis.service.ts
 *
 * Course analysis helpers for the SofLIA Study Planner context:
 * - detectCourseType
 * - calculateSuggestedSessionDurations
 * - analyzeCourses (static, used by context builder)
 */

import { CourseAnalysisService } from './course-analysis.service';
import type { StudyPlannerContext } from './lia-context.types';

export class LiaCourseAnalysisService {
  /**
   * Detecta el tipo de curso basándose en las categorías y duración promedio
   */
  static detectCourseType(
    categories: string[],
    averageDuration: number
  ): 'practical' | 'theoretical' | 'mixed' {
    // Categorías que indican cursos prácticos/aplicados
    const practicalKeywords = [
      'ia', 'inteligencia artificial', 'aplicada', 'práctica', 'herramientas',
      'productividad', 'automatización', 'desarrollo', 'programación', 'software',
      'marketing', 'ventas', 'comunicación', 'liderazgo', 'gestión'
    ];

    // Categorías que indican cursos teóricos/densos
    const theoreticalKeywords = [
      'matemáticas', 'física', 'química', 'estadística', 'contabilidad',
      'finanzas', 'economía', 'derecho', 'medicina', 'ciencias', 'teoría',
      'fundamentos', 'principios', 'metodología', 'investigación'
    ];

    const categoryString = categories.join(' ').toLowerCase();

    const practicalScore = practicalKeywords.filter(k => categoryString.includes(k)).length;
    const theoreticalScore = theoreticalKeywords.filter(k => categoryString.includes(k)).length;

    // También considerar la duración promedio
    // Lecciones cortas (<20min) tienden a ser prácticas
    // Lecciones largas (>40min) tienden a ser teóricas
    if (averageDuration < 20 && practicalScore >= theoreticalScore) {
      return 'practical';
    } else if (averageDuration > 40 || theoreticalScore > practicalScore) {
      return 'theoretical';
    } else if (practicalScore > theoreticalScore) {
      return 'practical';
    } else {
      return 'mixed';
    }
  }

  /**
   * Calcula las duraciones de sesión sugeridas basándose en el análisis del curso
   */
  static calculateSuggestedSessionDurations(
    courseType: 'practical' | 'theoretical' | 'mixed',
    averageDuration: number,
    minDuration: number,
    maxDuration: number
  ): { short: number; normal: number; long: number; reasoning: string } {
    let short: number;
    let normal: number;
    let long: number;
    let reasoning: string;

    switch (courseType) {
      case 'practical':
        // Cursos prácticos: sesiones más cortas pero frecuentes
        // Ideal para aprender y aplicar inmediatamente
        short = Math.max(minDuration, Math.round(averageDuration * 1.0)); // 1 lección
        normal = Math.round(averageDuration * 1.5); // 1-2 lecciones
        long = Math.round(averageDuration * 2.5); // 2-3 lecciones
        reasoning = `Curso PRÁCTICO/APLICADO: Las lecciones son cortas (promedio ${averageDuration} min) y enfocadas en aplicación inmediata. Sesiones cortas permiten aprender-practicar-aplicar sin fatiga mental.`;
        break;

      case 'theoretical':
        // Cursos teóricos: sesiones más largas para absorber contenido denso
        // Necesitan más tiempo de concentración
        short = Math.max(minDuration, Math.round(averageDuration * 0.8)); // Parte de 1 lección
        normal = Math.round(averageDuration * 1.2); // 1 lección completa
        long = Math.round(averageDuration * 2.0); // 1-2 lecciones
        reasoning = `Curso TEÓRICO/DENSO: Las lecciones son extensas (promedio ${averageDuration} min) con contenido que requiere concentración profunda. Se recomienda sesiones que permitan completar al menos una lección completa.`;
        break;

      case 'mixed':
      default:
        // Cursos mixtos: balance entre duración y frecuencia
        short = Math.max(minDuration, Math.round(averageDuration * 1.0));
        normal = Math.round(averageDuration * 1.5);
        long = Math.round(averageDuration * 2.0);
        reasoning = `Curso MIXTO: Combina teoría y práctica (promedio ${averageDuration} min por lección). Sesiones flexibles que se adaptan al ritmo del estudiante.`;
        break;
    }

    // Asegurar mínimos razonables
    short = Math.max(15, Math.round(short));
    normal = Math.max(25, Math.round(normal));
    long = Math.max(45, Math.round(long));

    // Asegurar que short < normal < long
    if (normal <= short) normal = short + 10;
    if (long <= normal) long = normal + 15;

    return { short, normal, long, reasoning };
  }

  /**
   * Analiza los cursos para SofLIA - Incluyendo análisis inteligente para sugerir duraciones de sesión
   */
  static async analyzeCourses(
    userId: string,
    courses: StudyPlannerContext['courses']
  ): Promise<StudyPlannerContext['courseAnalysis']> {
    let totalMinutes = 0;
    let totalLessons = 0;
    let totalComplexity = 0;
    let minLessonTime = Infinity;
    let maxLessonTime = 0;
    let coursesWithComplexity = 0;
    const allLessonDurations: number[] = [];
    const courseCategories: string[] = [];

    for (const course of courses) {
      // Guardar categoría del curso
      if (course.category) {
        courseCategories.push(course.category.toLowerCase());
      }

      // Tiempo restante
      const remaining = await CourseAnalysisService.calculateRemainingTime(userId, course.id);
      totalMinutes += remaining.totalRemainingMinutes;
      totalLessons += remaining.remainingLessons;

      // Complejidad
      const complexity = await CourseAnalysisService.getCourseComplexity(course.id);
      if (complexity) {
        totalComplexity += complexity.complexityScore;
        coursesWithComplexity++;
      }

      // Recopilar duraciones de todas las lecciones
      if (course.modules) {
        for (const module of course.modules) {
          for (const lesson of module.lessons) {
            if (lesson.durationMinutes && lesson.durationMinutes > 0) {
              allLessonDurations.push(lesson.durationMinutes);
              if (lesson.durationMinutes < minLessonTime) {
                minLessonTime = lesson.durationMinutes;
              }
              if (lesson.durationMinutes > maxLessonTime) {
                maxLessonTime = lesson.durationMinutes;
              }
            }
          }
        }
      }

      // Tiempo mínimo de lección (fallback al servicio)
      const minTime = await CourseAnalysisService.getMinimumLessonTime(course.id);
      if (minTime < minLessonTime) {
        minLessonTime = minTime;
      }
    }

    // Calcular promedio de duración de lecciones
    const averageLessonDuration = allLessonDurations.length > 0
      ? Math.round(allLessonDurations.reduce((a, b) => a + b, 0) / allLessonDurations.length)
      : 20; // Fallback a 20 min si no hay datos

    // Detectar tipo de curso según categorías
    const courseType = this.detectCourseType(courseCategories, averageLessonDuration);

    // Generar sugerencias de duración de sesión adaptadas al tipo de curso
    const suggestedSessionDurations = this.calculateSuggestedSessionDurations(
      courseType,
      averageLessonDuration,
      minLessonTime === Infinity ? 15 : minLessonTime,
      maxLessonTime || 60
    );

    return {
      totalMinutes,
      totalLessons,
      averageComplexity: coursesWithComplexity > 0
        ? Math.round((totalComplexity / coursesWithComplexity) * 10) / 10
        : 5,
      minimumLessonTime: minLessonTime === Infinity ? 15 : Math.ceil(minLessonTime),
      // ✅ NUEVO: Campos de análisis inteligente
      averageLessonDuration,
      maxLessonDuration: maxLessonTime || 60,
      minLessonDuration: minLessonTime === Infinity ? 15 : minLessonTime,
      courseType,
      suggestedSessionDurations,
    };
  }
}
