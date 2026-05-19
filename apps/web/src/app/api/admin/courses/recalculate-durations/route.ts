import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
import { logger as techDebtLogger } from '@/lib/utils/logger';

import {
  recalculateDurationsSchema,
  type RecalculateDurationsBody,
} from './schema';

interface CourseModuleRow {
  module_id: string;
  course_id: string;
}

interface CourseLessonDurationRow {
  lesson_id: string;
  module_id: string;
  duration_seconds: number | null;
}

interface TimedLessonContentRow {
  lesson_id: string;
  estimated_time_minutes: number | null;
}

async function handlePost(_request: NextRequest, body: RecalculateDurationsBody) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { courseId } = body;
    const supabase = await createClient();

    let modulesQuery = supabase
      .from('course_modules')
      .select('module_id, course_id')
      .order('module_order_index', { ascending: true });

    if (courseId) {
      modulesQuery = modulesQuery.eq('course_id', courseId);
    }

    const { data: modules, error: modulesError } = await modulesQuery;

    if (modulesError) {
      return apiError(
        'ADMIN_COURSE_MODULES_FETCH_FAILED',
        'Error al obtener modulos.',
        500,
      );
    }

    if (!modules || modules.length === 0) {
      return NextResponse.json({
        message: 'No hay modulos para recalcular',
        success: true,
        updated: 0,
      });
    }

    let updatedCount = 0;
    const results: Array<{ moduleId: string; newDuration: number }> = [];
    const moduleIds = modules.map((module) => module.module_id);

    const { data: allLessons } = await supabase
      .from('course_lessons')
      .select('lesson_id, module_id, duration_seconds')
      .in('module_id', moduleIds);

    const lessonsByModule = new Map<string, CourseLessonDurationRow[]>();
    for (const lesson of (allLessons ?? []) as CourseLessonDurationRow[]) {
      const existing = lessonsByModule.get(lesson.module_id) ?? [];
      existing.push(lesson);
      lessonsByModule.set(lesson.module_id, existing);
    }

    const allLessonIds = (allLessons ?? []).map((lesson: { lesson_id: string }) => lesson.lesson_id);
    const [materialsResult, activitiesResult] = allLessonIds.length > 0
      ? await Promise.all([
          supabase
            .from('lesson_materials')
            .select('lesson_id, estimated_time_minutes')
            .in('lesson_id', allLessonIds),
          supabase
            .from('lesson_activities')
            .select('lesson_id, estimated_time_minutes')
            .in('lesson_id', allLessonIds),
        ])
      : [{ data: [] }, { data: [] }];

    const materialsByLesson = new Map<string, number>();
    for (const material of (materialsResult.data ?? []) as TimedLessonContentRow[]) {
      materialsByLesson.set(
        material.lesson_id,
        (materialsByLesson.get(material.lesson_id) ?? 0) + (material.estimated_time_minutes ?? 0),
      );
    }

    const activitiesByLesson = new Map<string, number>();
    for (const activity of (activitiesResult.data ?? []) as TimedLessonContentRow[]) {
      activitiesByLesson.set(
        activity.lesson_id,
        (activitiesByLesson.get(activity.lesson_id) ?? 0) + (activity.estimated_time_minutes ?? 0),
      );
    }

    const moduleUpdates = modules.map((module) => {
      const lessonsList = lessonsByModule.get(module.module_id) ?? [];
      const totalVideoSeconds = lessonsList.reduce(
        (sum, lesson) => sum + (lesson.duration_seconds ?? 0),
        0,
      );
      const videoMinutes = Math.round(totalVideoSeconds / 60);

      let materialsMinutes = 0;
      let activitiesMinutes = 0;
      for (const lesson of lessonsList) {
        materialsMinutes += materialsByLesson.get(lesson.lesson_id) ?? 0;
        activitiesMinutes += activitiesByLesson.get(lesson.lesson_id) ?? 0;
      }

      return {
        courseId: module.course_id,
        moduleId: module.module_id,
        totalMinutes: videoMinutes + materialsMinutes + activitiesMinutes,
      };
    });

    const updateResults = await Promise.all(
      moduleUpdates.map(({ moduleId, totalMinutes }) =>
        supabase
          .from('course_modules')
          .update({
            module_duration_minutes: totalMinutes,
            updated_at: new Date().toISOString(),
          })
          .eq('module_id', moduleId)
          .then(({ error }) => ({ error, moduleId, totalMinutes })),
      ),
    );

    for (const result of updateResults) {
      if (!result.error) {
        updatedCount += 1;
        results.push({ moduleId: result.moduleId, newDuration: result.totalMinutes });
      }
    }

    const courseIds = [...new Set((modules as CourseModuleRow[]).map((module) => module.course_id))];
    const durationByCourse = new Map<string, number>();
    for (const { courseId: moduleCourseId, totalMinutes } of moduleUpdates) {
      durationByCourse.set(
        moduleCourseId,
        (durationByCourse.get(moduleCourseId) ?? 0) + totalMinutes,
      );
    }

    await Promise.all(
      courseIds.map((currentCourseId) =>
        supabase
          .from('courses')
          .update({
            duration_total_minutes: durationByCourse.get(currentCourseId) ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentCourseId),
      ),
    );

    return NextResponse.json({
      message: `Se recalcularon ${updatedCount} modulos exitosamente`,
      results,
      success: true,
      updated: updatedCount,
    });
  } catch (error) {
    techDebtLogger.error('Error recalculating durations:', error);
    return apiError(
      'ADMIN_COURSE_DURATIONS_RECALCULATION_FAILED',
      'Error al recalcular duraciones.',
      500,
    );
  }
}

export const POST = withZodBody(recalculateDurationsSchema, handlePost, {
  emptyBodyFallback: {},
});
