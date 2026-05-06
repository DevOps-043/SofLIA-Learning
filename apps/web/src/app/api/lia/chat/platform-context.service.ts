import { createClient } from '../../../../lib/supabase/server';
import type { LiaImageAttachment } from '../../../../core/reporting/report-problem.contract';
import type { ResolvedOrganizationContext } from './organization-context.service';

// ============================================
// INTERFACES
// ============================================
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: LiaImageAttachment[];
}

interface UserCourse { title: string | undefined; slug: string | undefined; progress: number | null; status: string }
interface UserLessonProgressItem {
  lessonTitle: string | undefined; lessonDescription: string | undefined; lessonOrder: number | undefined
  moduleName: string | undefined; moduleOrder: number | undefined; courseName: string | undefined; courseSlug: string | undefined
  status: string; isCompleted: boolean; videoProgress: number | null; timeSpentMinutes: number | null; durationMinutes: number
}
interface CourseWithContent { title: string | undefined; slug: string | undefined; description: string | undefined; level: string | undefined; durationMinutes: number | undefined; isAssigned: boolean }
interface LessonActivityContextItem {
  title: string;
  type: string;
  description?: string;
  isRequired?: boolean;
  isCompleted?: boolean;
}
interface LessonMaterialContextItem {
  title: string;
  type: string;
  description?: string;
  isRequired?: boolean;
}
interface LessonQuizContextItem {
  id: string;
  title: string;
  type: string;
  isCompleted: boolean;
  isPassed: boolean;
  percentage: number;
}

export interface PlatformContext {
  userName?: string;
  userRole?: string;
  userJobTitle?: string; // Nuevo: type_rol (Cargo real)
  userId?: string;
  currentPage?: string;
  currentTab?: string;
  // Propiedades dinámicas
  pageType?: string;
  organizationId?: string;
  organizationName?: string; // ✅ Campo nuevo
  organizationSlug?: string; // ✅ Campo para rutas dinámicas
  noCoursesAssigned?: boolean;
  [key: string]: unknown;
  // Datos de la plataforma
  totalCourses?: number;
  totalUsers?: number;
  totalOrganizations?: number;
  userCourses?: UserCourse[];
  recentActivity?: Record<string, unknown>[];
  platformStats?: Record<string, unknown>;
  // Información detallada de cursos
  coursesWithContent?: CourseWithContent[];
  userLessonProgress?: UserLessonProgressItem[];
  // Contexto específico de la lección actual (inyectado desde frontend)
  currentLessonContext?: {
    contextType?: 'course' | 'workshop';
    courseId?: string;
    courseSlug?: string;
    courseTitle?: string;
    courseDescription?: string;
    userRole?: string;
    moduleId?: string;
    moduleTitle?: string;
    lessonId?: string;
    lessonTitle?: string;
    transcript?: string | null;
    summary?: string | null;
    description?: string | null;
    durationSeconds?: number;
    totalDurationMinutes?: number;
    currentPage?: string;
    currentTab?: string;
    learningProgress?: {
      currentLessonNumber: number;
      totalLessons: number;
      progressPercentage: number;
      currentTab: string;
      timeInCurrentLesson: string;
    };
    activities?: {
      totalActivities: number;
      requiredActivities: number;
      completedActivities: number;
      pendingRequiredCount: number;
      pendingRequiredTitles?: string;
      items?: LessonActivityContextItem[];
      currentActivityFocus?:
        | (LessonActivityContextItem & { prompts?: string[] })
        | null;
    };
    materials?: {
      totalMaterials: number;
      requiredMaterials: number;
      items?: LessonMaterialContextItem[];
    };
    quiz?: {
      hasRequiredQuizzes: boolean;
      totalRequiredQuizzes: number;
      completedQuizzes: number;
      passedQuizzes: number;
      allQuizzesPassed: boolean;
      quizzes?: LessonQuizContextItem[];
    };
    userBehaviorContext?: string;
    difficultyDetected?: {
      patterns: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
      }>;
      overallScore: number;
      shouldIntervene: boolean;
      suggestedHelpType?: string;
    };
  };
  // Contexto de la actividad interactiva actual (NUEVO)
  currentActivityContext?: {
    title: string;
    type: string;
    description: string;
    prompts?: string[];
  };
  // Datos extendidos del usuario para personalización
  userCheck?: {
    area?: string;
    companySize?: string;
  };
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: PlatformContext;
  stream?: boolean;
  enrichedMetadata?: Record<string, unknown>;
  isBugReport?: boolean;
}

interface UserEnrollmentRow {
  overall_progress_percentage: number | null;
  enrollment_status: string;
  course: {
    title: string | null;
    slug: string | null;
  } | null;
}

interface LessonProgressRow {
  lesson_status: string;
  is_completed: boolean;
  video_progress_percentage: number | null;
  time_spent_minutes: number | null;
  lesson: {
    lesson_id: string;
    lesson_title: string | null;
    lesson_description: string | null;
    lesson_order_index: number | null;
    duration_seconds: number | null;
    summary_content: string | null;
    module: {
      module_title: string | null;
      module_order_index: number | null;
      course: {
        title: string | null;
        slug: string | null;
      } | null;
    } | null;
  } | null;
}

interface UserOrganizationRow {
  job_title: string | null;
  organizations: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface AssignedCourseRow {
  course: {
    id: string;
    title: string | null;
    slug: string | null;
    description: string | null;
    level: string | null;
    duration_total_minutes: number | null;
  } | null;
}

function normalizeNullableValue<T>(
  value: T | null | undefined
): T | undefined {
  return value ?? undefined;
}

function applyResolvedOrganizationContext(
  context: PlatformContext,
  organizationContext?: ResolvedOrganizationContext | null
) {
  if (!organizationContext) {
    return;
  }

  context.organizationId = organizationContext.organizationId;
  context.organizationName = organizationContext.organizationName;
  context.organizationSlug = organizationContext.organizationSlug;
  context.userJobTitle = organizationContext.userJobTitle;
}

async function loadLatestUserOrganizationContext(
  userId: string
): Promise<ResolvedOrganizationContext | null> {
  const supabase = await createClient();
  const { data: userOrg } = await supabase
    .from('organization_users')
    .select('job_title, organizations!inner(id, name, slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!userOrg) {
    return null;
  }

  const orgRow = userOrg as UserOrganizationRow;
  if (!orgRow.organizations?.id) {
    return null;
  }

  return {
    organizationId: orgRow.organizations.id,
    organizationName: orgRow.organizations.name,
    organizationSlug: orgRow.organizations.slug,
    userJobTitle: orgRow.job_title || undefined,
  };
}

// ============================================
// FUNCIONES PARA OBTENER CONTEXTO DE LA BD
// ============================================
export async function fetchPlatformContext(params: {
  userId?: string;
  organizationContext?: ResolvedOrganizationContext | null;
}): Promise<PlatformContext> {
  const { userId, organizationContext } = params;
  const context: PlatformContext = {};

  try {
    const supabase = await createClient();
    const effectiveOrganizationContext =
      organizationContext ||
      (userId ? await loadLatestUserOrganizationContext(userId) : null);
    const organizationId = effectiveOrganizationContext?.organizationId ?? null;

    applyResolvedOrganizationContext(context, effectiveOrganizationContext);

    // Estadísticas generales de la plataforma
    const [
      { count: coursesCount },
      { count: usersCount },
      { count: orgsCount }
    ] = await Promise.all([
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true })
    ]);

    context.totalCourses = coursesCount || 0;
    context.totalUsers = usersCount || 0;
    context.totalOrganizations = orgsCount || 0;

    // Si hay userId, obtener información específica del usuario
    if (userId) {
      // Cursos del usuario con progreso (tabla correcta: user_course_enrollments)
      let userEnrollmentsQuery = supabase
        .from('user_course_enrollments')
        .select('overall_progress_percentage, enrollment_status, course:courses(title, slug)')
        .eq('user_id', userId);

      if (organizationId) {
        userEnrollmentsQuery = userEnrollmentsQuery.eq(
          'organization_id',
          organizationId
        );
      } else {
        userEnrollmentsQuery = userEnrollmentsQuery.is('organization_id', null);
      }

      const { data: userEnrollments } = await userEnrollmentsQuery
        .order('last_accessed_at', { ascending: false })
        .limit(5);

      if (userEnrollments) {
        context.userCourses = (userEnrollments as UserEnrollmentRow[]).map((ue) => ({
          title: normalizeNullableValue(ue.course?.title),
          slug: normalizeNullableValue(ue.course?.slug),
          progress: ue.overall_progress_percentage,
          status: ue.enrollment_status
        }));
      }

      // Progreso del usuario en lecciones específicas
      let lessonProgressQuery = supabase
        .from('user_lesson_progress')
        .select('lesson_status, is_completed, video_progress_percentage, current_time_seconds, time_spent_minutes, lesson:course_lessons(lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, summary_content, module:course_modules(module_title, module_order_index, course:courses(title, slug)))')
        .eq('user_id', userId);

      if (organizationId) {
        lessonProgressQuery = lessonProgressQuery.eq(
          'organization_id',
          organizationId
        );
      } else {
        lessonProgressQuery = lessonProgressQuery.is('organization_id', null);
      }

      const { data: lessonProgress } = await lessonProgressQuery
        .order('last_accessed_at', { ascending: false })
        .limit(15);

      if (lessonProgress && lessonProgress.length > 0) {
        context.userLessonProgress = (lessonProgress as LessonProgressRow[]).map((lp) => ({
          lessonTitle: normalizeNullableValue(lp.lesson?.lesson_title),
          lessonDescription: normalizeNullableValue(lp.lesson?.lesson_description),
          lessonOrder: normalizeNullableValue(lp.lesson?.lesson_order_index),
          moduleName: normalizeNullableValue(lp.lesson?.module?.module_title),
          moduleOrder: normalizeNullableValue(lp.lesson?.module?.module_order_index),
          courseName: normalizeNullableValue(lp.lesson?.module?.course?.title),
          courseSlug: normalizeNullableValue(lp.lesson?.module?.course?.slug),
          status: lp.lesson_status,
          isCompleted: lp.is_completed,
          videoProgress: lp.video_progress_percentage,
          timeSpentMinutes: lp.time_spent_minutes,
          durationMinutes: Math.round((lp.lesson?.duration_seconds || 0) / 60)
        }));
      }

      // Información del usuario (solo nombre)
      // NOTA: El cargo profesional viene de organization_users.job_title, NO de users.cargo_rol
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, display_name, username')
        .eq('id', userId)
        .single();
      if (userData) {
        context.userName =
          userData.first_name || userData.display_name || userData.username;

        // ✅ OBTENER ORGANIZACIÓN ACTIVA (nombre, slug y job_title del usuario)
        // NOTA: type_rol fue eliminado de la tabla users. El cargo profesional
        // ahora vive en organization_users.job_title
      }
    }

    // ✅ CURSOS ASIGNADOS AL USUARIO
    // IMPORTANTE: Solo cargamos cursos que el usuario tiene ASIGNADOS
    // NO hay usuarios B2C - todos son usuarios de business
    if (userId) {
      // Solo mostrar cursos asignados a través de organization_course_assignments
      let assignedCoursesQuery = supabase
        .from('organization_course_assignments')
        .select('course:courses!inner(id, title, slug, description, level, duration_total_minutes)')
        .eq('user_id', userId);

      if (organizationId) {
        assignedCoursesQuery = assignedCoursesQuery.eq(
          'organization_id',
          organizationId
        );
      } else {
        assignedCoursesQuery = assignedCoursesQuery.is('organization_id', null);
      }

      const { data: assignedCourses } = await assignedCoursesQuery.limit(20);

      if (assignedCourses && assignedCourses.length > 0) {
        context.coursesWithContent = (assignedCourses as AssignedCourseRow[]).map((assignment) => ({
          title: normalizeNullableValue(assignment.course?.title),
          slug: normalizeNullableValue(assignment.course?.slug),
          description: normalizeNullableValue(assignment.course?.description),
          level: normalizeNullableValue(assignment.course?.level),
          durationMinutes: normalizeNullableValue(assignment.course?.duration_total_minutes),
          isAssigned: true
        }));
      } else {
        // Si no tiene cursos asignados, marcarlo explícitamente
        context.coursesWithContent = [];
        context.noCoursesAssigned = true;
      }
    } else {
      // Sin userId, no podemos mostrar cursos
      context.coursesWithContent = [];
      context.noCoursesAssigned = true;
    }

  } catch (error) {
    console.error('⚠️ Error fetching platform context:', error);
  }

  return context;
}
