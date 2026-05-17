import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getOptionalCourseSkillUser, authorizeCourseSkillEdit } from './auth'
import { resolveCourseByIdentifier } from './course-resolver'
import { formatCourseSkillResponse } from './skill-formatters'
import { addUserSkillLevels, fetchCourseSkills } from './skill-queries'
import { replaceCourseSkills } from './skill-updates'
import type { CourseSkillInput, CourseSkillRow } from './types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: identifier } = await params
    const supabase = await createClient()
    const resolvedCourse = await resolveCourseByIdentifier(supabase, identifier)
    if ('response' in resolvedCourse) return resolvedCourse.response

    const { data: courseSkills, error: skillsError } = await fetchCourseSkills(
      supabase,
      resolvedCourse.course.id,
    )
    if (skillsError) {
      logger.error('Error fetching course skills:', skillsError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener skills del curso' },
        { status: 500 },
      )
    }

    const auth = await getOptionalCourseSkillUser(supabase)
    const skillsWithUserLevels = await addUserSkillLevels(
      supabase,
      (courseSkills || []) as CourseSkillRow[],
      auth?.user.id,
    )

    return NextResponse.json({
      success: true,
      skills: skillsWithUserLevels.map(formatCourseSkillResponse),
    })
  } catch (error) {
    logger.error('Error in /api/courses/[slug]/skills GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: identifier } = await params
    const supabase = await createClient()
    const resolvedCourse = await resolveCourseByIdentifier(supabase, identifier)
    if ('response' in resolvedCourse) return resolvedCourse.response

    const authorization = await authorizeCourseSkillEdit(
      supabase,
      resolvedCourse.course,
    )
    if ('response' in authorization) return authorization.response

    const { skills } = await request.json()
    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { success: false, error: 'Skills debe ser un array' },
        { status: 400 },
      )
    }

    const updateError = await replaceCourseSkills(
      supabase,
      resolvedCourse.course.id,
      skills as CourseSkillInput[],
    )
    if (updateError) return updateError

    return NextResponse.json({
      success: true,
      message: 'Skills asignadas correctamente',
    })
  } catch (error) {
    logger.error('Error in /api/courses/[slug]/skills POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
