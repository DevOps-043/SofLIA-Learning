import { createAdminClient } from '@/lib/supabase/admin';
import type { StudyPlannerCoverageResult, StudyPlannerCourseCoverage } from './study-planner-coverage.types';
import { computeStudyPlannerCourseCoverage, extractPlannedLessonIdsFromSession } from './study-planner-coverage-compute.server.service';
import {
  getPlanForUser,
  resolvePlanCourseIds,
  getCourseTitles,
  getPublishedCourseLessons,
  getCompletedLessonIds,
  getPlannedSessionIdsByLessonId,
} from './study-planner-coverage-db.server.service';

export type {
  StudyPlannerCoverageStatus,
  StudyPlannerCoverageLesson,
  StudyPlannerCourseCoverage,
  StudyPlannerCoverageResult,
} from './study-planner-coverage.types';
export { extractPlannedLessonIdsFromSession, computeStudyPlannerCourseCoverage };

export async function getStudyPlannerCoverageForPlan(params: {
  planId: string;
  userId: string;
}): Promise<StudyPlannerCoverageResult | null> {
  const supabase = createAdminClient();
  const plan = await getPlanForUser(supabase, params.userId, params.planId);
  if (!plan) return null;

  const courseIds = Array.from(new Set(await resolvePlanCourseIds(plan, params.planId, params.userId)));
  const [courseTitleById, plannedSessionIdsByLessonId] = await Promise.all([
    getCourseTitles(supabase, courseIds),
    getPlannedSessionIdsByLessonId(supabase, params.userId, params.planId),
  ]);

  const courses: StudyPlannerCourseCoverage[] = [];
  for (const courseId of courseIds) {
    const lessons = await getPublishedCourseLessons(supabase, courseId);
    const completedLessonIds = await getCompletedLessonIds(supabase, params.userId, lessons.map((l) => l.lessonId));
    courses.push(computeStudyPlannerCourseCoverage({ completedLessonIds, courseId, courseTitle: courseTitleById.get(courseId) || 'Curso', lessons, plannedSessionIdsByLessonId }));
  }

  const totals = courses.reduce(
    (acc, c) => ({
      completedLessons: acc.completedLessons + c.completedLessons,
      coveredBySessions: acc.coveredBySessions + c.coveredBySessions,
      pendingLessons: acc.pendingLessons + c.pendingLessons,
      plannedLessons: acc.plannedLessons + c.plannedLessons,
      totalLessons: acc.totalLessons + c.totalLessons,
      unplannedLessons: acc.unplannedLessons + c.unplannedLessons,
    }),
    { completedLessons: 0, coveredBySessions: 0, pendingLessons: 0, plannedLessons: 0, totalLessons: 0, unplannedLessons: 0 },
  );

  return { courses, plan: { id: plan.id, name: plan.name }, totals };
}

export function formatStudyPlannerCoverageForPrompt(coverage: StudyPlannerCoverageResult): string {
  const lines = [
    '## COBERTURA DETERMINISTICA DEL PLAN',
    'Esta seccion viene de base de datos. No recalcules estos conteos desde texto libre.',
    `TOTAL PLAN: ${coverage.totals.totalLessons} lecciones | ${coverage.totals.completedLessons} completadas | ${coverage.totals.plannedLessons} planificadas | ${coverage.totals.unplannedLessons} sin sesion | ${coverage.totals.pendingLessons} pendientes.`,
  ];

  for (const course of coverage.courses) {
    lines.push(`- ${course.courseTitle}: total=${course.totalLessons}, completadas=${course.completedLessons}, planificadas=${course.plannedLessons}, sin_sesion=${course.unplannedLessons}, pendientes=${course.pendingLessons}, estado=${course.coverageStatus}.`);
  }

  return lines.join('\n');
}
