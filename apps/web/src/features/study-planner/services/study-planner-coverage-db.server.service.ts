import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import { extractPlanCourseIds, listUserStudyPlans } from './study-planner-plans.server.service';
import { extractPlannedLessonIdsFromSession } from './study-planner-coverage-compute.server.service';

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type Json = Database['public']['Tables']['study_sessions']['Row']['metrics'];

interface RawStudyPlanRow {
  ai_generation_metadata?: { courseIds?: unknown } | null;
  id: string;
  name: string;
  user_id: string;
}

interface CourseRow { id: string; title: string | null }
interface ModuleRow { module_id: string; module_order_index: number; module_title: string }
interface LessonRow { lesson_id: string; lesson_order_index: number; lesson_title: string; module_id: string }
interface SessionRow { course_id: string | null; id: string; lesson_id: string | null; metrics: Json; status: string }
interface ProgressRow { is_completed: boolean | null; lesson_id: string }

export type { RawStudyPlanRow };

export async function getPlanForUser(supabase: SupabaseAdminClient, userId: string, planId: string): Promise<RawStudyPlanRow | null> {
  const { data, error } = await supabase.from('study_plans').select('id, name, user_id, ai_generation_metadata').eq('id', planId).eq('user_id', userId).single();
  if (error || !data) return null;
  return data as RawStudyPlanRow;
}

export async function resolvePlanCourseIds(plan: RawStudyPlanRow, planId: string, userId: string): Promise<string[]> {
  const fromMetadata = extractPlanCourseIds(plan.ai_generation_metadata);
  if (fromMetadata.length > 0) return fromMetadata;
  const plans = await listUserStudyPlans(userId);
  return plans.find((p) => p.id === planId)?.courseIds || [];
}

export async function getCourseTitles(supabase: SupabaseAdminClient, courseIds: string[]): Promise<Map<string, string>> {
  if (courseIds.length === 0) return new Map();
  const { data } = await supabase.from('courses').select('id, title').in('id', courseIds);
  return new Map(((data || []) as CourseRow[]).map((c) => [c.id, c.title || 'Curso']));
}

export async function getPublishedCourseLessons(
  supabase: SupabaseAdminClient,
  courseId: string,
): Promise<Array<{ lessonId: string; lessonOrderIndex: number; lessonTitle: string; moduleId: string; moduleOrderIndex: number; moduleTitle: string }>> {
  const { data: modules } = await supabase.from('course_modules').select('module_id, module_title, module_order_index').eq('course_id', courseId).eq('is_published', true).order('module_order_index', { ascending: true });
  const moduleRows = (modules || []) as ModuleRow[];
  if (moduleRows.length === 0) return [];
  const moduleById = new Map(moduleRows.map((m) => [m.module_id, m]));
  const { data: lessons } = await supabase.from('course_lessons').select('lesson_id, lesson_title, lesson_order_index, module_id').in('module_id', moduleRows.map((m) => m.module_id)).eq('is_published', true).order('lesson_order_index', { ascending: true });
  return ((lessons || []) as LessonRow[]).map((l) => {
    const mod = moduleById.get(l.module_id);
    return { lessonId: l.lesson_id, lessonOrderIndex: l.lesson_order_index, lessonTitle: l.lesson_title, moduleId: l.module_id, moduleOrderIndex: mod?.module_order_index ?? 0, moduleTitle: mod?.module_title || 'Modulo' };
  }).sort((a, b) => a.moduleOrderIndex !== b.moduleOrderIndex ? a.moduleOrderIndex - b.moduleOrderIndex : a.lessonOrderIndex - b.lessonOrderIndex);
}

export async function getCompletedLessonIds(supabase: SupabaseAdminClient, userId: string, lessonIds: string[]): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();
  const { data } = await supabase.from('user_lesson_progress').select('lesson_id, is_completed').eq('user_id', userId).eq('is_completed', true).in('lesson_id', lessonIds);
  return new Set(((data || []) as ProgressRow[]).filter((p) => p.is_completed).map((p) => p.lesson_id));
}

export async function getPlannedSessionIdsByLessonId(supabase: SupabaseAdminClient, userId: string, planId: string): Promise<Map<string, Set<string>>> {
  const { data } = await supabase.from('study_sessions').select('id, course_id, lesson_id, status, metrics').eq('plan_id', planId).eq('user_id', userId);
  const result = new Map<string, Set<string>>();
  for (const session of (data || []) as SessionRow[]) {
    if (session.status === 'cancelled') continue;
    for (const lessonId of extractPlannedLessonIdsFromSession(session)) {
      const ids = result.get(lessonId) || new Set<string>();
      ids.add(session.id);
      result.set(lessonId, ids);
    }
  }
  return result;
}
