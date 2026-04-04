import { createClient } from '../../../../lib/supabase/server';

// ============================================
// INTERFACES
// ============================================
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserCourse { title: string | undefined; slug: string | undefined; progress: number | null; status: string }
interface UserLessonProgressItem {
  lessonTitle: string | undefined; lessonDescription: string | undefined; lessonOrder: number | undefined
  moduleName: string | undefined; moduleOrder: number | undefined; courseName: string | undefined; courseSlug: string | undefined
  status: string; isCompleted: boolean; videoProgress: number | null; timeSpentMinutes: number | null; durationMinutes: number
}
interface CourseWithContent { title: string | undefined; slug: string | undefined; description: string | undefined; level: string | undefined; durationMinutes: number | undefined; isAssigned: boolean }

export interface PlatformContext {
  userName?: string;
  userRole?: string;
  userJobTitle?: string; // Nuevo: type_rol (Cargo real)
  userId?: string;
  currentPage?: string;
  // Propiedades dinámicas
  pageType?: string;
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
    lessonId?: string;
    lessonTitle?: string;
    transcript?: string | null;
    summary?: string | null;
    description?: string | null;
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
  sessionSnapshot?: string; // Base64 de rrweb
  enrichedMetadata?: Record<string, unknown>;
  isBugReport?: boolean;
  recordingStatus?: string;
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
  organizations: {
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

// ============================================
// FUNCIONES PARA OBTENER CONTEXTO DE LA BD
// ============================================
export async function fetchPlatformContext(userId?: string): Promise<PlatformContext> {
  const context: PlatformContext = {};

  try {
    const supabase = await createClient();

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
      const { data: userEnrollments } = await supabase
        .from('user_course_enrollments')
        .select('overall_progress_percentage, enrollment_status, course:courses(title, slug)')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
        .limit(5);

      if (userEnrollments) {
        context.userCourses = (userEnrollments as UserEnrollmentRow[]).map((ue) => ({
          title: ue.course?.title,
          slug: ue.course?.slug,
          progress: ue.overall_progress_percentage,
          status: ue.enrollment_status
        }));
      }

      // Progreso del usuario en lecciones específicas
      const { data: lessonProgress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_status, is_completed, video_progress_percentage, current_time_seconds, time_spent_minutes, lesson:course_lessons(lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, summary_content, module:course_modules(module_title, module_order_index, course:courses(title, slug)))')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
        .limit(15);

      if (lessonProgress && lessonProgress.length > 0) {
        context.userLessonProgress = (lessonProgress as LessonProgressRow[]).map((lp) => ({
          lessonTitle: lp.lesson?.lesson_title,
          lessonDescription: lp.lesson?.lesson_description,
          lessonOrder: lp.lesson?.lesson_order_index,
          moduleName: lp.lesson?.module?.module_title,
          moduleOrder: lp.lesson?.module?.module_order_index,
          courseName: lp.lesson?.module?.course?.title,
          courseSlug: lp.lesson?.module?.course?.slug,
          status: lp.lesson_status,
          isCompleted: lp.is_completed,
          videoProgress: lp.video_progress_percentage,
          timeSpentMinutes: lp.time_spent_minutes,
          durationMinutes: Math.round((lp.lesson?.duration_seconds || 0) / 60)
        }));
      }

      // Información del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('nombre, first_name, cargo_rol, type_rol')
        .eq('id', userId)
        .single();
      if (userData) {
        context.userName = userData.first_name || userData.nombre;
        context.userRole = userData.cargo_rol;
        context.userJobTitle = userData.type_rol;

        // ✅ OBTENER ORGANIZACIÓN ACTIVA (nombre y slug)
        const { data: userOrg } = await supabase
          .from('organization_users')
          .select('organizations!inner(name, slug)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('joined_at', { ascending: false }) // Priorizar la más reciente
          .limit(1)
          .maybeSingle();

        if (userOrg?.organizations) {
          const organization = (userOrg as UserOrganizationRow).organizations;
          context.organizationName = organization?.name;
          context.organizationSlug = organization?.slug;
        }
      }
    }

    // ✅ CURSOS ASIGNADOS AL USUARIO
    // IMPORTANTE: Solo cargamos cursos que el usuario tiene ASIGNADOS
    // NO hay usuarios B2C - todos son usuarios de business
    if (userId) {
      // Solo mostrar cursos asignados a través de organization_course_assignments
      const { data: assignedCourses } = await supabase
        .from('organization_course_assignments')
        .select('course:courses!inner(id, title, slug, description, level, duration_total_minutes)')
        .eq('user_id', userId)
        .limit(20);

      if (assignedCourses && assignedCourses.length > 0) {
        context.coursesWithContent = (assignedCourses as AssignedCourseRow[]).map((assignment) => ({
          title: assignment.course?.title,
          slug: assignment.course?.slug,
          description: assignment.course?.description,
          level: assignment.course?.level,
          durationMinutes: assignment.course?.duration_total_minutes,
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
