import { fromLoose } from '@/lib/supabase/looseQuery'

import type { ForensicContentContext, ForensicContentRefs } from './user-forensics.types'

/**
 * Índice de contenido para la auditoría forense: resuelve en UNA pasada (sin N+1) los
 * nombres de curso, módulo, lección, actividad y ruta a partir de los ids referenciados
 * por los eventos y los bloqueos.
 *
 * Es clave para que un auditor entienda *dónde* ocurrió cada cosa: una lección suelta
 * ("Lección 1.1") no dice nada sin su módulo y su curso. La cadena se recorre hacia
 * arriba —actividad → lección → módulo → curso— porque las tablas de eventos solo
 * guardan la referencia más profunda.
 */

interface LessonNode {
  title: string | null
  moduleId: string | null
  orderIndex: number | null
}

interface ModuleNode {
  title: string | null
  courseId: string | null
  orderIndex: number | null
}

interface ActivityNode {
  title: string | null
  lessonId: string | null
}

export interface ForensicContentIndex {
  courses: Map<string, string | null>
  modules: Map<string, ModuleNode>
  lessons: Map<string, LessonNode>
  activities: Map<string, ActivityNode>
  learningPaths: Map<string, string | null>
}

export const EMPTY_CONTENT_INDEX: ForensicContentIndex = {
  courses: new Map(),
  modules: new Map(),
  lessons: new Map(),
  activities: new Map(),
  learningPaths: new Map(),
}

export interface ForensicContentIds {
  courseIds: Set<string>
  lessonIds: Set<string>
  activityIds: Set<string>
  learningPathIds: Set<string>
}

export function emptyContentIds(): ForensicContentIds {
  return {
    courseIds: new Set(),
    lessonIds: new Set(),
    activityIds: new Set(),
    learningPathIds: new Set(),
  }
}

export function collectContentIds(
  refs: Iterable<ForensicContentRefs>,
  into: ForensicContentIds = emptyContentIds(),
): ForensicContentIds {
  for (const ref of refs) {
    if (ref.courseId) into.courseIds.add(ref.courseId)
    if (ref.lessonId) into.lessonIds.add(ref.lessonId)
    if (ref.activityId) into.activityIds.add(ref.activityId)
    if (ref.learningPathId) into.learningPathIds.add(ref.learningPathId)
  }
  return into
}

type LooseClient = unknown

async function fetchActivities(
  supabase: LooseClient,
  activityIds: string[],
): Promise<Map<string, ActivityNode>> {
  if (activityIds.length === 0) return new Map()
  const { data } = await fromLoose<{
    activity_id: string
    activity_title: string | null
    lesson_id: string | null
  }>(supabase, 'lesson_activities')
    .select('activity_id, activity_title, lesson_id')
    .in('activity_id', activityIds)

  return new Map(
    (data ?? []).map((row) => [
      row.activity_id,
      { title: row.activity_title, lessonId: row.lesson_id },
    ]),
  )
}

async function fetchLessons(
  supabase: LooseClient,
  lessonIds: string[],
): Promise<Map<string, LessonNode>> {
  if (lessonIds.length === 0) return new Map()
  const { data } = await fromLoose<{
    lesson_id: string
    lesson_title: string | null
    module_id: string | null
    lesson_order_index: number | null
  }>(supabase, 'course_lessons')
    .select('lesson_id, lesson_title, module_id, lesson_order_index')
    .in('lesson_id', lessonIds)

  return new Map(
    (data ?? []).map((row) => [
      row.lesson_id,
      { title: row.lesson_title, moduleId: row.module_id, orderIndex: row.lesson_order_index },
    ]),
  )
}

async function fetchModules(
  supabase: LooseClient,
  moduleIds: string[],
): Promise<Map<string, ModuleNode>> {
  if (moduleIds.length === 0) return new Map()
  const { data } = await fromLoose<{
    module_id: string
    module_title: string | null
    course_id: string | null
    module_order_index: number | null
  }>(supabase, 'course_modules')
    .select('module_id, module_title, course_id, module_order_index')
    .in('module_id', moduleIds)

  return new Map(
    (data ?? []).map((row) => [
      row.module_id,
      { title: row.module_title, courseId: row.course_id, orderIndex: row.module_order_index },
    ]),
  )
}

async function fetchCourses(
  supabase: LooseClient,
  courseIds: string[],
): Promise<Map<string, string | null>> {
  if (courseIds.length === 0) return new Map()
  const { data } = await fromLoose<{ id: string; title: string | null }>(supabase, 'courses')
    .select('id, title')
    .in('id', courseIds)

  return new Map((data ?? []).map((row) => [row.id, row.title]))
}

async function fetchLearningPaths(
  supabase: LooseClient,
  pathIds: string[],
): Promise<Map<string, string | null>> {
  if (pathIds.length === 0) return new Map()
  const { data } = await fromLoose<{ id: string; title: string | null }>(
    supabase,
    'learning_paths',
  )
    .select('id, title')
    .in('id', pathIds)

  return new Map((data ?? []).map((row) => [row.id, row.title]))
}

/**
 * Construye el índice resolviendo la jerarquía por niveles: actividades → lecciones →
 * módulos → cursos. Cada nivel añade los ids que descubre al siguiente, de modo que
 * son cuatro consultas como máximo, independientemente del número de eventos.
 */
export async function buildForensicContentIndex(
  supabase: LooseClient,
  ids: ForensicContentIds,
): Promise<ForensicContentIndex> {
  const activities = await fetchActivities(supabase, [...ids.activityIds])

  const lessonIds = new Set(ids.lessonIds)
  for (const activity of activities.values()) {
    if (activity.lessonId) lessonIds.add(activity.lessonId)
  }

  const lessons = await fetchLessons(supabase, [...lessonIds])

  const moduleIds = new Set<string>()
  for (const lesson of lessons.values()) {
    if (lesson.moduleId) moduleIds.add(lesson.moduleId)
  }

  const modules = await fetchModules(supabase, [...moduleIds])

  const courseIds = new Set(ids.courseIds)
  for (const module of modules.values()) {
    if (module.courseId) courseIds.add(module.courseId)
  }

  const [courses, learningPaths] = await Promise.all([
    fetchCourses(supabase, [...courseIds]),
    fetchLearningPaths(supabase, [...ids.learningPathIds]),
  ])

  return { courses, modules, lessons, activities, learningPaths }
}

/** Prefija el título con su posición ("2. Sesgos…") cuando el orden es conocido. */
function withOrder(title: string | null, orderIndex: number | null): string | null {
  if (!title) return null
  return orderIndex && orderIndex > 0 ? `${orderIndex}. ${title}` : title
}

/**
 * Contexto legible (curso · módulo · lección · actividad) de una referencia. Sube por la
 * jerarquía: si el evento solo trae `activityId`, se deducen lección, módulo y curso.
 */
export function resolveContentContext(
  index: ForensicContentIndex,
  refs: ForensicContentRefs,
): ForensicContentContext {
  const activity = refs.activityId ? index.activities.get(refs.activityId) : undefined
  const lessonId = refs.lessonId ?? activity?.lessonId ?? null
  const lesson = lessonId ? index.lessons.get(lessonId) : undefined
  const moduleId = lesson?.moduleId ?? null
  const module = moduleId ? index.modules.get(moduleId) : undefined
  const courseId = refs.courseId ?? module?.courseId ?? null

  return {
    courseTitle: courseId ? (index.courses.get(courseId) ?? null) : null,
    moduleTitle: module ? withOrder(module.title, module.orderIndex) : null,
    lessonTitle: lesson ? withOrder(lesson.title, lesson.orderIndex) : null,
    activityTitle: activity?.title ?? null,
    learningPathTitle: refs.learningPathId
      ? (index.learningPaths.get(refs.learningPathId) ?? null)
      : null,
  }
}

/** ¿El contexto aporta algo? Evita renderizar migas de pan vacías. */
export function hasContentContext(context: ForensicContentContext): boolean {
  return Boolean(
    context.courseTitle ||
      context.moduleTitle ||
      context.lessonTitle ||
      context.activityTitle ||
      context.learningPathTitle,
  )
}

/** Miga de pan en texto plano para CSV, PDF y prompts de IA. */
export function formatContentContext(context: ForensicContentContext): string {
  return [
    context.courseTitle,
    context.moduleTitle,
    context.lessonTitle,
    context.activityTitle,
    context.learningPathTitle,
  ]
    .filter(Boolean)
    .join(' · ')
}
