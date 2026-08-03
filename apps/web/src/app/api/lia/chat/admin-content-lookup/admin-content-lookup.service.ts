import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  CATALOG_CACHE_TTL_MS,
  createCatalogCache,
} from '../admin-lookup-shared/catalog-cache'
import {
  resolveContentLookupScope,
  type AdminReadGrant,
  type AdminReadScope,
} from '../superadmin/authorization'
import {
  analyzeCourseDropoff,
  summarizeCourseAdoption,
  summarizeCourseOrganizations,
  summarizeCourseStructure,
  type ActivityRow,
  type EnrollmentRow,
  type LessonProgressRow,
  type LessonRow,
  type ModuleRow,
} from './content-metrics'
import type {
  ContentCatalog,
  ContentIndex,
  CourseDossier,
  CourseProfile,
  LearningPathCatalogEntry,
  LearningPathDossier,
} from './types'
import {
  MAX_CATALOG_COURSES,
  MAX_CATALOG_LEARNING_PATHS,
  MAX_COURSE_ACTIVITY_ROWS,
  MAX_COURSE_ENROLLMENT_ROWS,
  MAX_COURSE_LESSONS,
  MAX_COURSE_MODULES,
  MAX_INDEXED_COURSES,
  MAX_INDEXED_LEARNING_PATHS,
  MAX_LESSON_PROGRESS_ROWS,
} from './types'

/**
 * Lectura de cursos y rutas de aprendizaje para el contexto de SofLIA.
 *
 * SEGURIDAD: usa el cliente service-role, así que TODA función pública exige un
 * grant y deriva de él su alcance con `resolveContentLookupScope`:
 *
 *  - grant de superadmin de plataforma → cualquier curso, con las cifras de toda
 *    la plataforma y el reparto por organización;
 *  - grant de owner/admin de organización → solo los cursos que su empresa tiene
 *    asignados o en uso, y SIEMPRE con las cifras de su empresa. Nunca ve el
 *    rendimiento del curso en otros tenants.
 *
 * Sin grant válido se lanza y no se consulta nada (fail-closed).
 */

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

const COURSE_PROFILE_COLUMNS =
  'id, title, slug, description, category, level, duration_total_minutes, is_active, ' +
  'approval_status, average_rating, review_count, learning_objectives, instructor_id, ' +
  'created_at, updated_at'

interface CourseProfileRow {
  id: string
  title: string
  slug: string | null
  description: string | null
  category: string | null
  level: string | null
  duration_total_minutes: number | null
  is_active: boolean | null
  approval_status: string | null
  average_rating: number | null
  review_count: number | null
  learning_objectives: unknown
  instructor_id: string | null
  created_at: string | null
  updated_at: string | null
}

function parseLearningObjectives(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Los catálogos se consultan en cada turno para detectar menciones, pero cambian
 * pocas veces al día: se cachean por alcance durante un minuto.
 */
const contentCatalogCache = createCatalogCache<ContentCatalog>(CATALOG_CACHE_TTL_MS)

/** Ids de curso que la organización tiene asignados o en uso. */
async function loadOrganizationCourseIds(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<string[]> {
  const [assignmentsResult, enrollmentsResult] = await Promise.all([
    supabase
      .from('organization_course_assignments')
      .select('course_id')
      .eq('organization_id', organizationId)
      .limit(MAX_COURSE_ENROLLMENT_ROWS),
    supabase
      .from('user_course_enrollments')
      .select('course_id')
      .eq('organization_id', organizationId)
      .limit(MAX_COURSE_ENROLLMENT_ROWS),
  ])

  if (assignmentsResult.error && enrollmentsResult.error) {
    logger.warn('Consulta de contenido: fallo al resolver los cursos de la organización', {
      error: assignmentsResult.error.message,
    })
    return []
  }

  const courseIds = new Set<string>()
  for (const row of assignmentsResult.data ?? []) courseIds.add(row.course_id)
  for (const row of enrollmentsResult.data ?? []) courseIds.add(row.course_id)

  return Array.from(courseIds).slice(0, MAX_CATALOG_COURSES)
}

/** Rutas de aprendizaje asignadas a la organización. */
async function loadOrganizationLearningPaths(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<LearningPathCatalogEntry[]> {
  const { data, error } = await supabase
    .from('organization_learning_path_assignments')
    .select('learning_paths(id, title, slug)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .limit(MAX_CATALOG_LEARNING_PATHS)

  if (error) {
    logger.warn('Consulta de contenido: fallo al cargar rutas de la organización', {
      error: error.message,
    })
    return []
  }

  const rows = (data ?? []) as unknown as Array<{
    learning_paths: { id: string; title: string; slug: string | null } | null
  }>

  return rows
    .map((row) => row.learning_paths)
    .filter((path): path is { id: string; title: string; slug: string | null } =>
      path !== null,
    )
    .map((path) => ({ id: path.id, title: path.title, slug: path.slug }))
}

/**
 * Catálogo de cursos y rutas visibles para el actor. Es la base para detectar de
 * qué contenido habla el administrador sin adivinar títulos.
 */
export async function loadContentCatalog(
  grant: AdminReadGrant,
): Promise<ContentCatalog> {
  const scope = resolveContentLookupScope(grant)

  // La clave lleva el alcance: dos tenants nunca comparten entrada de caché.
  return contentCatalogCache.get(scope.organizationId ?? 'platform', async () => {
    const supabase = createAdminClient()

    if (scope.organizationId) {
      const [courseIds, learningPaths] = await Promise.all([
        loadOrganizationCourseIds(supabase, scope.organizationId),
        loadOrganizationLearningPaths(supabase, scope.organizationId),
      ])

      if (courseIds.length === 0) return { courses: [], learningPaths }

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .in('id', courseIds)

      if (error) {
        logger.warn('Consulta de contenido: fallo al cargar el catálogo del tenant', {
          error: error.message,
        })
        return { courses: [], learningPaths }
      }

      return {
        courses: (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
        })),
        learningPaths,
      }
    }

    const [coursesResult, learningPathsResult] = await Promise.all([
      supabase
        .from('courses')
        .select('id, title, slug')
        .order('title', { ascending: true })
        .limit(MAX_CATALOG_COURSES),
      supabase
        .from('learning_paths')
        .select('id, title, slug')
        .order('title', { ascending: true })
        .limit(MAX_CATALOG_LEARNING_PATHS),
    ])

    if (coursesResult.error) {
      logger.warn('Consulta de contenido: fallo al cargar el catálogo de plataforma', {
        error: coursesResult.error.message,
      })
    }

    return {
      courses: (coursesResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
      })),
      learningPaths: (learningPathsResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
      })),
    }
  })
}

/**
 * Índice general del catálogo. Solo tiene sentido —y solo se permite— en alcance
 * de plataforma: el administrador de una organización ya recibe el detalle de
 * adopción de SUS cursos en el dossier de su empresa.
 *
 * Usa `courses.student_count`, que ya viene denormalizado, en lugar de contar
 * inscripciones: da la misma respuesta sin recorrer la tabla de matrículas.
 */
export async function loadContentIndex(
  grant: AdminReadGrant,
): Promise<ContentIndex | null> {
  const scope = resolveContentLookupScope(grant)
  if (scope.organizationId) return null

  const supabase = createAdminClient()
  const [coursesResult, learningPathsResult, itemsResult] = await Promise.all([
    supabase
      .from('courses')
      .select(
        'id, title, slug, category, level, duration_total_minutes, is_active, approval_status, student_count, average_rating',
      )
      .order('student_count', { ascending: false })
      .limit(MAX_CATALOG_COURSES),
    supabase
      .from('learning_paths')
      .select('id, title, slug, is_active')
      .order('title', { ascending: true })
      .limit(MAX_CATALOG_LEARNING_PATHS),
    supabase
      .from('learning_path_items')
      .select('learning_path_id')
      .limit(MAX_CATALOG_LEARNING_PATHS * 50),
  ])

  if (coursesResult.error) {
    logger.warn('Consulta de contenido: fallo al construir el índice de catálogo', {
      error: coursesResult.error.message,
    })
    return null
  }

  const courseCountByPath = new Map<string, number>()
  for (const row of itemsResult.data ?? []) {
    courseCountByPath.set(
      row.learning_path_id,
      (courseCountByPath.get(row.learning_path_id) ?? 0) + 1,
    )
  }

  const courses = coursesResult.data ?? []
  const learningPaths = learningPathsResult.data ?? []

  return {
    courses: courses.slice(0, MAX_INDEXED_COURSES).map((row) => ({
      title: row.title,
      slug: row.slug,
      category: row.category,
      level: row.level,
      durationMinutes: row.duration_total_minutes ?? 0,
      isActive: row.is_active !== false,
      approvalStatus: row.approval_status,
      studentCount: row.student_count ?? 0,
      averageRating: Number(row.average_rating) || 0,
    })),
    learningPaths: learningPaths.slice(0, MAX_INDEXED_LEARNING_PATHS).map((row) => ({
      title: row.title,
      slug: row.slug,
      courseCount: courseCountByPath.get(row.id) ?? 0,
      isActive: row.is_active !== false,
    })),
    truncated:
      courses.length > MAX_INDEXED_COURSES ||
      learningPaths.length > MAX_INDEXED_LEARNING_PATHS,
  }
}

async function loadInstructorName(
  supabase: AdminSupabaseClient,
  instructorId: string | null,
): Promise<string | null> {
  if (!instructorId) return null

  const { data } = await supabase
    .from('users')
    .select('display_name, first_name, last_name, username')
    .eq('id', instructorId)
    .maybeSingle()

  if (!data) return null
  return (
    data.display_name ||
    [data.first_name, data.last_name].filter(Boolean).join(' ') ||
    data.username ||
    null
  )
}

async function loadCourseProfile(
  supabase: AdminSupabaseClient,
  courseId: string,
): Promise<CourseProfile | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_PROFILE_COLUMNS)
    .eq('id', courseId)
    .maybeSingle()

  if (error || !data) {
    logger.warn('Consulta de contenido: fallo al cargar el perfil del curso', {
      error: error?.message,
    })
    return null
  }

  const row = data as unknown as CourseProfileRow
  const instructorName = await loadInstructorName(supabase, row.instructor_id)

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    level: row.level,
    durationMinutes: row.duration_total_minutes ?? 0,
    isActive: row.is_active !== false,
    approvalStatus: row.approval_status,
    averageRating: Number(row.average_rating) || 0,
    reviewCount: row.review_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    instructorName,
    learningObjectives: parseLearningObjectives(row.learning_objectives),
  }
}

async function loadStructureRows(
  supabase: AdminSupabaseClient,
  courseId: string,
): Promise<{
  modules: ModuleRow[]
  lessons: LessonRow[]
  activities: ActivityRow[]
  truncated: boolean
}> {
  const { data: moduleData, error: moduleError } = await supabase
    .from('course_modules')
    .select(
      'module_id, module_title, module_order_index, module_duration_minutes, is_published, is_required',
    )
    .eq('course_id', courseId)
    .order('module_order_index', { ascending: true })
    .limit(MAX_COURSE_MODULES)

  if (moduleError) {
    logger.warn('Consulta de contenido: fallo al cargar módulos', {
      error: moduleError.message,
    })
    return { modules: [], lessons: [], activities: [], truncated: false }
  }

  const modules: ModuleRow[] = (moduleData ?? []).map((row) => ({
    moduleId: row.module_id,
    title: row.module_title,
    orderIndex: row.module_order_index,
    isPublished: row.is_published === true,
    isRequired: row.is_required === true,
    durationMinutes: row.module_duration_minutes ?? 0,
  }))

  if (modules.length === 0) {
    return { modules, lessons: [], activities: [], truncated: false }
  }

  const { data: lessonData, error: lessonError } = await supabase
    .from('course_lessons')
    .select(
      'lesson_id, module_id, lesson_title, lesson_order_index, total_duration_minutes, duration_seconds, is_published',
    )
    .in(
      'module_id',
      modules.map((module) => module.moduleId),
    )
    .order('lesson_order_index', { ascending: true })
    .limit(MAX_COURSE_LESSONS)

  if (lessonError) {
    logger.warn('Consulta de contenido: fallo al cargar lecciones', {
      error: lessonError.message,
    })
    return { modules, lessons: [], activities: [], truncated: false }
  }

  const lessonRows = lessonData ?? []
  const lessons: LessonRow[] = lessonRows.map((row) => ({
    lessonId: row.lesson_id,
    moduleId: row.module_id,
    title: row.lesson_title,
    orderIndex: row.lesson_order_index,
    // `total_duration_minutes` puede venir a 0 en cursos antiguos: se cae a la
    // duración del vídeo, que siempre está.
    durationMinutes:
      row.total_duration_minutes || Math.round((row.duration_seconds ?? 0) / 60),
    isPublished: row.is_published === true,
  }))

  if (lessons.length === 0) {
    return { modules, lessons, activities: [], truncated: false }
  }

  const { data: activityData } = await supabase
    .from('lesson_activities')
    .select('lesson_id, activity_type')
    .in(
      'lesson_id',
      lessons.map((lesson) => lesson.lessonId),
    )
    .limit(MAX_COURSE_ACTIVITY_ROWS)

  return {
    modules,
    lessons,
    activities: (activityData ?? []).map((row) => ({
      lessonId: row.lesson_id,
      activityType: row.activity_type,
    })),
    truncated: lessonRows.length >= MAX_COURSE_LESSONS,
  }
}

async function loadEnrollments(
  supabase: AdminSupabaseClient,
  courseId: string,
  tenantId: string | null,
): Promise<{ rows: EnrollmentRow[]; truncated: boolean }> {
  const query = supabase
    .from('user_course_enrollments')
    .select(
      'user_id, organization_id, enrollment_status, overall_progress_percentage, enrolled_at, completed_at, last_accessed_at',
    )
    .eq('course_id', courseId)

  const { data, error } = await (tenantId
    ? query.eq('organization_id', tenantId)
    : query
  ).limit(MAX_COURSE_ENROLLMENT_ROWS)

  if (error) {
    logger.warn('Consulta de contenido: fallo al cargar inscripciones del curso', {
      error: error.message,
    })
    return { rows: [], truncated: false }
  }

  const rows = data ?? []
  return {
    rows: rows.map((row) => ({
      userId: row.user_id,
      organizationId: row.organization_id,
      status: row.enrollment_status,
      progressPercentage: Number(row.overall_progress_percentage) || 0,
      enrolledAt: row.enrolled_at,
      completedAt: row.completed_at,
      lastAccessedAt: row.last_accessed_at,
    })),
    truncated: rows.length >= MAX_COURSE_ENROLLMENT_ROWS,
  }
}

async function loadLessonProgress(
  supabase: AdminSupabaseClient,
  lessonIds: string[],
  tenantId: string | null,
): Promise<LessonProgressRow[]> {
  if (lessonIds.length === 0) return []

  const query = supabase
    .from('user_lesson_progress')
    .select('lesson_id, user_id, started_at, is_completed')
    .in('lesson_id', lessonIds)

  const { data, error } = await (tenantId
    ? query.eq('organization_id', tenantId)
    : query
  ).limit(MAX_LESSON_PROGRESS_ROWS)

  if (error) {
    logger.warn('Consulta de contenido: fallo al cargar progreso por lección', {
      error: error.message,
    })
    return []
  }

  return (data ?? []).map((row) => ({
    lessonId: row.lesson_id,
    userId: row.user_id,
    startedAt: row.started_at,
    isCompleted: row.is_completed === true,
  }))
}

async function loadOrganizationNames(
  supabase: AdminSupabaseClient,
  organizationIds: string[],
): Promise<Map<string, string>> {
  if (organizationIds.length === 0) return new Map()

  const { data } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', organizationIds)

  return new Map((data ?? []).map((row) => [row.id, row.name] as const))
}

async function loadLearningPathTitlesForCourse(
  supabase: AdminSupabaseClient,
  courseId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('learning_path_items')
    .select('learning_paths(title)')
    .eq('course_id', courseId)
    .limit(MAX_CATALOG_LEARNING_PATHS)

  const rows = (data ?? []) as unknown as Array<{
    learning_paths: { title: string | null } | null
  }>

  return rows
    .map((row) => row.learning_paths?.title)
    .filter((title): title is string => Boolean(title))
}

/**
 * Construye el dossier completo de un curso.
 *
 * En alcance organizacional, inscripciones y progreso se filtran por
 * `organization_id`: el administrador ve cómo le va el curso a SU gente, nunca
 * el rendimiento agregado de otras empresas.
 *
 * Cada consulta degrada de forma independiente: un fallo parcial recorta el
 * dossier pero no lo invalida.
 */
export async function buildCourseDossier(
  grant: AdminReadGrant,
  courseId: string,
): Promise<CourseDossier | null> {
  const scope: AdminReadScope = resolveContentLookupScope(grant)
  const tenantId = scope.organizationId
  const supabase = createAdminClient()

  const profile = await loadCourseProfile(supabase, courseId)
  if (!profile) return null

  const certificatesQuery = supabase
    .from('user_course_certificates')
    .select('certificate_id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const [structureRows, enrollments, certificatesResult, inLearningPaths] =
    await Promise.all([
      loadStructureRows(supabase, courseId),
      loadEnrollments(supabase, courseId, tenantId),
      tenantId ? certificatesQuery.eq('organization_id', tenantId) : certificatesQuery,
      loadLearningPathTitlesForCourse(supabase, courseId),
    ])

  const progress = await loadLessonProgress(
    supabase,
    structureRows.lessons.map((lesson) => lesson.lessonId),
    tenantId,
  )

  // El reparto por empresa solo existe en alcance de plataforma: en alcance de
  // tenant sería siempre una única fila (la suya) y revelaría nada nuevo.
  const organizations = tenantId
    ? []
    : summarizeCourseOrganizations({
        enrollments: enrollments.rows,
        organizationNamesById: await loadOrganizationNames(
          supabase,
          Array.from(
            new Set(
              enrollments.rows
                .map((row) => row.organizationId)
                .filter((id): id is string => Boolean(id)),
            ),
          ),
        ),
      })

  return {
    profile,
    structure: summarizeCourseStructure(structureRows),
    adoption: summarizeCourseAdoption({
      enrollments: enrollments.rows,
      certificatesIssued: certificatesResult.count ?? 0,
      truncated: enrollments.truncated,
    }),
    dropoff: analyzeCourseDropoff({
      modules: structureRows.modules,
      lessons: structureRows.lessons,
      activities: structureRows.activities,
      progress,
    }),
    organizations,
    inLearningPaths,
  }
}

/**
 * Dossier de una ruta de aprendizaje: qué cursos la componen, en qué orden y
 * cómo avanza la gente. En alcance organizacional, el progreso es el de su
 * empresa y no se revela a cuántas otras empresas está asignada.
 */
export async function buildLearningPathDossier(
  grant: AdminReadGrant,
  learningPathId: string,
): Promise<LearningPathDossier | null> {
  const scope = resolveContentLookupScope(grant)
  const tenantId = scope.organizationId
  const supabase = createAdminClient()

  const { data: pathRow, error } = await supabase
    .from('learning_paths')
    .select('id, title, slug, description, is_active, created_at')
    .eq('id', learningPathId)
    .maybeSingle()

  if (error || !pathRow) {
    logger.warn('Consulta de contenido: fallo al cargar la ruta de aprendizaje', {
      error: error?.message,
    })
    return null
  }

  const progressQuery = supabase
    .from('user_learning_path_progress')
    .select('user_id, status, progress_percentage')
    .eq('learning_path_id', learningPathId)

  const assignmentsQuery = supabase
    .from('organization_learning_path_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('learning_path_id', learningPathId)
    .eq('status', 'active')

  const [itemsResult, progressResult, assignmentsResult] = await Promise.all([
    supabase
      .from('learning_path_items')
      .select('position, courses(title, is_active)')
      .eq('learning_path_id', learningPathId)
      .order('position', { ascending: true })
      .limit(MAX_CATALOG_COURSES),
    tenantId ? progressQuery.eq('organization_id', tenantId) : progressQuery,
    tenantId ? Promise.resolve({ count: null }) : assignmentsQuery,
  ])

  const items = (itemsResult.data ?? []) as unknown as Array<{
    position: number
    courses: { title: string | null; is_active: boolean | null } | null
  }>

  const progressRows = (progressResult.data ?? []) as unknown as Array<{
    status: string | null
    progress_percentage: number | null
  }>

  const progressSum = progressRows.reduce(
    (sum, row) => sum + (Number(row.progress_percentage) || 0),
    0,
  )

  return {
    title: pathRow.title,
    slug: pathRow.slug,
    description: pathRow.description,
    isActive: pathRow.is_active !== false,
    createdAt: pathRow.created_at,
    courses: items.map((item) => ({
      position: item.position,
      courseTitle: item.courses?.title ?? 'Curso sin título',
      isActive: item.courses?.is_active !== false,
    })),
    organizationsAssigned: assignmentsResult.count ?? null,
    usersWithProgress: progressRows.length,
    usersCompleted: progressRows.filter((row) => row.status === 'completed').length,
    averageProgressPercentage:
      progressRows.length > 0
        ? Math.round((progressSum / progressRows.length) * 10) / 10
        : 0,
  }
}
