import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { aggregateCourseDeadlineContext } from './course-aggregation'
import { fetchDeadlineCourse } from './course-query'
import { calculateDeadlineOptions } from './ai-deadlines'
import {
  buildDeadlineSuggestions,
  resolveStartDate,
} from './suggestions'

interface DeadlineSuggestionsRequestParams {
  courseId: string
  organizationSlug?: string
  request: NextRequest
}

export async function handleDeadlineSuggestionsRequest({
  courseId,
  organizationSlug,
  request,
}: DeadlineSuggestionsRequestParams) {
  try {
    const auth = await requireBusiness(
      organizationSlug ? { organizationSlug } : undefined,
    )
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ error: 'Organizacion requerida' }, { status: 403 })
    }

    const { data: course, error } = await fetchDeadlineCourse(
      await createClient(),
      courseId,
    )

    if (error || !course) {
      techDebtLogger.error('Error fetching course data:', error)
      return NextResponse.json(
        { error: 'Curso no encontrado', details: error },
        { status: 404 },
      )
    }

    const context = aggregateCourseDeadlineContext(course)
    const { deadlines, reasoning } = await calculateDeadlineOptions(context)
    const startDate = resolveStartDate(
      request.nextUrl.searchParams.get('start_date'),
    )

    return NextResponse.json({
      success: true,
      course_id: course.id,
      title: course.title,
      total_content_minutes: context.dbTotalMinutes,
      total_effort_hours: Math.round(context.finalTotalHours * 10) / 10,
      ai_reasoning: reasoning.summary,
      suggestions: buildDeadlineSuggestions({
        deadlines,
        finalTotalHours: context.finalTotalHours,
        reasoning,
        startDate,
      }),
      source: 'lia_smart_calc_v2',
    })
  } catch (error) {
    techDebtLogger.error('Error calculating suggestions:', error)
    return NextResponse.json(
      { error: 'Error interno de calculo' },
      { status: 500 },
    )
  }
}
