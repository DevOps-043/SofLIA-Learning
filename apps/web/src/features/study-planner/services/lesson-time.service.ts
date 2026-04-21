/**
 * Lesson Time Service
 * Calculates and fetches lesson time estimates for the planner.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  CourseTimeEstimate,
  CoursesTimeAnalysis,
  LessonTimeEstimate,
  SupabaseServerClient,
} from './lesson-time.types';
import { calculateLessonsTimeRealtime } from './lesson-time-realtime.service';

export type {
  CourseTimeEstimate,
  CoursesTimeAnalysis,
  LessonTimeEstimate,
} from './lesson-time.types';

export class LessonTimeService {
  private static readonly INTERACTION_TIME_MINUTES = 3;

  static getLessonDuration(lessonTotalMinutes: number): number {
    return Math.ceil(lessonTotalMinutes);
  }

  static getTotalLessonsDuration(lessons: { totalMinutes: number }[]): number {
    return lessons.reduce((total, lesson) => total + Math.ceil(lesson.totalMinutes), 0);
  }

  static async getCourseTimeEstimate(courseId: string): Promise<CourseTimeEstimate | null> {
    const supabase = await createClient();
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course:', courseError);
      return null;
    }

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
        lessonCount: 0,
      };
    }

    const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.totalMinutes, 0);
    const lessonTimes = lessons.map((lesson) => lesson.totalMinutes);

    return {
      courseId: course.id,
      courseTitle: course.title,
      lessons,
      totalMinutes,
      averageLessonMinutes: Math.round(totalMinutes / lessons.length),
      minLessonMinutes: Math.min(...lessonTimes),
      maxLessonMinutes: Math.max(...lessonTimes),
      lessonCount: lessons.length,
    };
  }

  private static async getCourseLessonsTime(
    courseId: string,
    supabase: SupabaseServerClient,
  ): Promise<LessonTimeEstimate[]> {
    return calculateLessonsTimeRealtime(courseId, supabase, this.INTERACTION_TIME_MINUTES);
  }

  static async analyzeCoursesTime(courseIds: string[]): Promise<CoursesTimeAnalysis> {
    const courses: CourseTimeEstimate[] = [];
    let totalMinutes = 0;
    let totalLessons = 0;
    const allLessonMinutes: number[] = [];

    for (const courseId of courseIds) {
      const courseEstimate = await this.getCourseTimeEstimate(courseId);
      if (!courseEstimate) {
        continue;
      }

      courses.push(courseEstimate);
      totalMinutes += courseEstimate.totalMinutes;
      totalLessons += courseEstimate.lessonCount;
      allLessonMinutes.push(...courseEstimate.lessons.map((lesson) => lesson.totalMinutes));
    }

    const globalMinLessonMinutes = allLessonMinutes.length > 0 ? Math.min(...allLessonMinutes) : 0;
    const globalMaxLessonMinutes = allLessonMinutes.length > 0 ? Math.max(...allLessonMinutes) : 0;
    const globalAverageLessonMinutes = totalLessons > 0 ? Math.round(totalMinutes / totalLessons) : 0;
    const recommendedMinSessionMinutes = globalMaxLessonMinutes > 0 ? globalMaxLessonMinutes : 30;

    return {
      courses,
      totalMinutes,
      totalLessons,
      globalMinLessonMinutes,
      globalMaxLessonMinutes,
      globalAverageLessonMinutes,
      recommendedMinSessionMinutes,
    };
  }

  static async validateSessionTime(
    sessionMinutes: number,
    courseIds: string[],
  ): Promise<{ isValid: boolean; minRequired: number; message: string }> {
    const analysis = await this.analyzeCoursesTime(courseIds);

    if (analysis.totalLessons === 0) {
      return {
        isValid: true,
        minRequired: 30,
        message: 'No se encontraron lecciones en los cursos seleccionados.',
      };
    }

    const minRequired = analysis.recommendedMinSessionMinutes;
    if (sessionMinutes < minRequired) {
      return {
        isValid: false,
        minRequired,
        message: `El tiempo minimo de sesion debe ser de ${minRequired} minutos para poder completar las lecciones. La leccion mas larga dura ${analysis.globalMaxLessonMinutes} minutos.`,
      };
    }

    return {
      isValid: true,
      minRequired,
      message: `Tiempo de sesion valido. Podras completar lecciones de hasta ${analysis.globalMaxLessonMinutes} minutos.`,
    };
  }

  static estimateCompletionTime(
    totalMinutes: number,
    sessionsPerWeek: number,
    sessionDurationMinutes: number,
  ): { weeks: number; estimatedEndDate: Date } {
    const weeklyStudyMinutes = sessionsPerWeek * sessionDurationMinutes;
    const weeks = Math.ceil(totalMinutes / weeklyStudyMinutes);
    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + weeks * 7);

    return { weeks, estimatedEndDate };
  }

  static formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}min`;
  }
}
