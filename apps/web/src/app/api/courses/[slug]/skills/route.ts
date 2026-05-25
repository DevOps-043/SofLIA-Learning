import { NextRequest, NextResponse } from 'next/server'

import {
  courseSkillsSchema,
  type CourseSkillsBody,
} from '@/app/api/courses/_schemas'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

import { getOptionalCourseSkillUser, authorizeCourseSkillEdit } from './auth'
import { resolveCourseByIdentifier } from './course-resolver'
import { formatCourseSkillResponse } from './skill-formatters'
import { addUserSkillLevels, fetchCourseSkills } from './skill-queries'
import { replaceCourseSkills } from './skill-updates'
import type { CourseSkillRow } from './types'

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

async function handlePost(
  _request: NextRequest,
  body: CourseSkillsBody,
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

    const updateError = await replaceCourseSkills(
      supabase,
      resolvedCourse.course.id,
      body.skills,
    )
    if (updateError) return updateError

    return NextResponse.json({
      success: true,
      message: 'Skills asignadas correctamente',
    })
  } catch (error) {
    logger.error('Error in /api/courses/[slug]/skills POST:', error)
    return apiError('INTERNAL_ERROR', 'Error interno del servidor.', 500)
  }
}

export const POST = withZodBody(courseSkillsSchema, handlePost)
