import { PurchasedCoursesService } from '@/features/courses/services/purchased-courses.service'
import { fromLoose } from '@/lib/supabase/looseQuery'
import type { CourseFullQueryResults } from './full-results.types'
import type { CourseData, CourseSkillRow, FullCourseRequest } from './full.types'

export async function runCourseFullQueries(
  request: FullCourseRequest,
  courseData: CourseData,
  courseId: string,
): Promise<CourseFullQueryResults> {
  const [modulesResult, skillsResult, purchaseCheck, enrollmentResult, instructorResult] =
    await Promise.all([
      request.supabase
        .from('course_modules')
        .select('module_id, module_title, module_order_index, module_duration_minutes, is_published')
        .eq('course_id', courseId)
        .order('module_order_index', { ascending: true }),
      fromLoose<CourseSkillRow>(request.supabase, 'course_skills')
        .select(`
          id,
          is_primary,
          is_required,
          proficiency_level,
          display_order,
          skills (
            skill_id, name, slug, description, category,
            icon_url, icon_type, icon_name, color, level
          )
        `)
        .eq('course_id', courseId)
        .order('display_order', { ascending: true })
        .limit(20),
      request.effectiveUserId
        ? PurchasedCoursesService.isCoursePurchased(request.effectiveUserId, courseId)
        : Promise.resolve(false),
      request.effectiveUserId
        ? request.supabase
            .from('user_course_enrollments')
            .select('enrollment_id, overall_progress_percentage')
            .eq('user_id', request.effectiveUserId)
            .eq('course_id', courseId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      courseData.instructor_id
        ? request.supabase
            .from('users')
            .select(`
              id, first_name, last_name, display_name, username, email,
              profile_picture_url, bio, cargo_rol, location
            `)
            .eq('id', courseData.instructor_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

  const allModules = modulesResult.data || []
  const publishedModules = allModules.filter((module) => module.is_published === true)

  return {
    modules: publishedModules.length > 0 ? publishedModules : allModules,
    skills: skillsResult.data || [],
    purchaseCheck,
    enrollment: enrollmentResult.data,
    instructor: instructorResult.data || null,
  }
}
