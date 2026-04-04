import { DatabaseError, NotFoundError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import type { Database } from '@/core/supabase/database.types'
import { getServiceClient } from '@/core/supabase/service-client'

import type {
  CourseInstructor,
  CourseListItem,
  LessonProgress,
  NormalizedCourseListQuery,
  UpdateProgressInput,
} from './courses.types'

const COURSE_SELECT_FIELDS = `
  id,
  title,
  description,
  category,
  level,
  instructor_id,
  duration_total_minutes,
  thumbnail_url,
  slug,
  is_active,
  price,
  average_rating,
  student_count,
  review_count,
  learning_objectives,
  created_at,
  updated_at,
  instructor:users!fk_courses_instructor (
    id,
    first_name,
    last_name,
    email,
    username
  )
`

type CourseRow = Database['public']['Tables']['courses']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type UserCourseEnrollmentRow =
  Database['public']['Tables']['user_course_enrollments']['Row']
type UserLessonProgressRow =
  Database['public']['Tables']['user_lesson_progress']['Row']

type CourseSelectRow = Pick<
  CourseRow,
  | 'id'
  | 'title'
  | 'description'
  | 'category'
  | 'level'
  | 'instructor_id'
  | 'duration_total_minutes'
  | 'thumbnail_url'
  | 'slug'
  | 'is_active'
  | 'price'
  | 'average_rating'
  | 'student_count'
  | 'review_count'
  | 'created_at'
  | 'updated_at'
> & {
  instructor: Pick<
    UserRow,
    'id' | 'first_name' | 'last_name' | 'email' | 'username'
  > | null
}

function mapInstructor(
  instructor: CourseSelectRow['instructor'],
): CourseInstructor | null {
  if (!instructor) {
    return null
  }

  return {
    id: instructor.id,
    first_name: instructor.first_name,
    last_name: instructor.last_name,
    email: instructor.email,
    username: instructor.username,
  }
}

function mapCourse(row: CourseSelectRow): CourseListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    level: row.level,
    instructor_id: row.instructor_id,
    duration_total_minutes: row.duration_total_minutes,
    thumbnail_url: row.thumbnail_url,
    slug: row.slug,
    is_active: row.is_active ?? false,
    price: row.price,
    average_rating: row.average_rating,
    student_count: row.student_count,
    review_count: row.review_count,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    instructor: mapInstructor(row.instructor),
  }
}

function mapLessonProgress(row: UserLessonProgressRow): LessonProgress {
  const progressPercent =
    row.video_progress_percentage ?? (row.is_completed ? 100 : 0)

  return {
    progress_id: row.progress_id,
    lesson_id: row.lesson_id,
    user_id: row.user_id,
    enrollment_id: row.enrollment_id,
    progress_percent: progressPercent,
    time_spent_seconds: (row.time_spent_minutes ?? 0) * 60,
    is_completed: row.is_completed ?? false,
    last_position: row.current_time_seconds ?? 0,
    completed_at: row.completed_at,
    updated_at: row.updated_at,
    last_accessed_at: row.last_accessed_at,
    lesson_status: row.lesson_status,
    video_progress_percentage: progressPercent,
    quiz_completed: row.quiz_completed ?? false,
    quiz_passed: row.quiz_passed ?? false,
  }
}

function mapEnrollment(
  row: Pick<UserCourseEnrollmentRow, 'course_id' | 'started_at' | 'completed_at'>,
): { course_id: string; enrolled_at: string } {
  return {
    course_id: row.course_id,
    enrolled_at: row.started_at ?? row.completed_at ?? '',
  }
}

export interface CoursesRepository {
  findCourses(
    query: NormalizedCourseListQuery,
  ): Promise<{ courses: CourseListItem[]; total: number }>
  findCourseBySlug(slug: string): Promise<CourseListItem>
  findLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<LessonProgress | null>
  upsertLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    data: UpdateProgressInput,
  ): Promise<LessonProgress>
  findUserEnrollments(
    userId: string,
  ): Promise<{ course_id: string; enrolled_at: string }[]>
}

export class SupabaseCoursesRepository implements CoursesRepository {
  async findCourses(
    query: NormalizedCourseListQuery,
  ): Promise<{ courses: CourseListItem[]; total: number }> {
    const supabase = getServiceClient()

    let coursesQuery = supabase
      .from('courses')
      .select(COURSE_SELECT_FIELDS, { count: 'exact' })
      .eq('is_active', query.isActive)

    if (query.category) {
      coursesQuery = coursesQuery.eq('category', query.category)
    }

    if (query.level) {
      coursesQuery = coursesQuery.eq('level', query.level)
    }

    if (query.search) {
      coursesQuery = coursesQuery.ilike('title', `%${query.search}%`)
    }

    coursesQuery = coursesQuery
      .order(query.orderBy, { ascending: query.orderDirection === 'asc' })
      .range(query.offset, query.offset + query.limit - 1)

    const { data, error, count } = await coursesQuery

    if (error) {
      logger.error('Error fetching courses', { error: error.message })
      throw new DatabaseError('Error al obtener cursos')
    }

    return {
      courses: (data ?? []).map((course) => mapCourse(course as CourseSelectRow)),
      total: count ?? 0,
    }
  }

  async findCourseBySlug(slug: string): Promise<CourseListItem> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('courses')
      .select(COURSE_SELECT_FIELDS)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      throw new NotFoundError(`Curso no encontrado: ${slug}`)
    }

    return mapCourse(data as CourseSelectRow)
  }

  async findLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    const supabase = getServiceClient()
    const enrollment = await this.findEnrollment(userId, courseId)

    if (!enrollment) {
      return null
    }

    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollment.enrollment_id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching lesson progress', { error: error.message })
      throw new DatabaseError('Error al obtener progreso de leccion')
    }

    return data ? mapLessonProgress(data) : null
  }

  async upsertLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    data: UpdateProgressInput,
  ): Promise<LessonProgress> {
    const supabase = getServiceClient()
    const enrollment = await this.findEnrollment(userId, courseId)

    if (!enrollment) {
      throw new NotFoundError(
        `Inscripcion no encontrada para el curso: ${courseId}`,
      )
    }

    const { data: existingProgress, error: existingProgressError } = await supabase
      .from('user_lesson_progress')
      .select('progress_id')
      .eq('enrollment_id', enrollment.enrollment_id)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existingProgressError) {
      logger.error('Error fetching existing lesson progress', {
        error: existingProgressError.message,
      })
      throw new DatabaseError('Error al consultar progreso de leccion')
    }

    const now = new Date().toISOString()
    const lessonStatus =
      data.isCompleted === true
        ? 'completed'
        : data.progressPercent > 0
          ? 'in_progress'
          : 'not_started'

    const sharedPayload = {
      user_id: userId,
      lesson_id: lessonId,
      enrollment_id: enrollment.enrollment_id,
      time_spent_minutes:
        data.timeSpentSeconds !== undefined
          ? Math.max(0, Math.round(data.timeSpentSeconds / 60))
          : undefined,
      is_completed: data.isCompleted,
      completed_at:
        data.isCompleted === true
          ? now
          : data.isCompleted === false
            ? null
            : undefined,
      last_accessed_at: now,
      current_time_seconds: data.lastPosition,
      video_progress_percentage: data.progressPercent,
      lesson_status: lessonStatus,
      updated_at: now,
    }

    const result = existingProgress
      ? await supabase
          .from('user_lesson_progress')
          .update(sharedPayload)
          .eq('progress_id', existingProgress.progress_id)
          .select('*')
          .single()
      : await supabase
          .from('user_lesson_progress')
          .insert({
            ...sharedPayload,
            created_at: now,
            started_at: now,
          })
          .select('*')
          .single()

    if (result.error || !result.data) {
      logger.error('Error upserting lesson progress', {
        error: result.error?.message,
      })
      throw new DatabaseError('Error al actualizar progreso de leccion')
    }

    return mapLessonProgress(result.data)
  }

  async findUserEnrollments(
    userId: string,
  ): Promise<{ course_id: string; enrolled_at: string }[]> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('user_course_enrollments')
      .select('course_id, started_at, completed_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) {
      logger.error('Error fetching enrollments', { error: error.message })
      throw new DatabaseError('Error al obtener inscripciones')
    }

    return (data ?? []).map((enrollment) => mapEnrollment(enrollment))
  }

  private async findEnrollment(
    userId: string,
    courseId: string,
  ): Promise<UserCourseEnrollmentRow | null> {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('user_course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching course enrollment', { error: error.message })
      throw new DatabaseError('Error al obtener inscripcion del curso')
    }

    return data
  }
}
