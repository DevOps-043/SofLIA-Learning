import { NextResponse } from 'next/server'
import { CourseService } from '@/features/courses/services/course.service'
import type { CourseData, FullCourseRequest } from './full.types'

export interface CourseIdentity {
  courseData: CourseData
  courseId: string
}

export async function fetchCourseIdentity(
  request: FullCourseRequest,
): Promise<CourseIdentity | NextResponse> {
  const [courseData, courseIdResult] = await Promise.all([
    CourseService.getCourseBySlug(request.slug, request.effectiveUserId),
    request.supabase.from('courses').select('id').eq('slug', request.slug).single(),
  ])

  if (!courseData || courseIdResult.error || !courseIdResult.data) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  return {
    courseData,
    courseId: courseIdResult.data.id,
  }
}
