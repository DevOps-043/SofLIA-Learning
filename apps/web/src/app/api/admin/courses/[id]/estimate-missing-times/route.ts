import { NextRequest, NextResponse } from 'next/server'
import { CourseTimeEstimationService } from '@/features/admin/services/courseTimeEstimation.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import { loadCourseStructure } from './estimate-missing-times/course-structure.loader'
import { loadPendingTimeItems } from './estimate-missing-times/pending-time-items.loader'
import { applyEstimationResults } from './estimate-missing-times/estimation-updates.service'
import {
  buildEstimationTargets,
  countEstimationSources,
} from './estimate-missing-times/estimation-targets.service'
import {
  emptyModulesResponse,
  emptyLessonsResponse,
  emptyTargetsResponse,
  estimationInfoResponse,
  estimationSuccessResponse,
  estimationErrorResponse,
} from './estimate-missing-times/estimation-responses'
import type { EstimateRouteContext } from './estimate-missing-times/estimation.types'

export async function POST(
  _request: NextRequest,
  { params }: EstimateRouteContext,
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: courseId } = await params
    const supabase = await createClient()
    const structure = await loadCourseStructure(supabase, courseId)
    if (structure instanceof NextResponse) return structure
    if (structure.moduleIds.length === 0) return emptyModulesResponse()
    if (structure.lessonIds.length === 0) return emptyLessonsResponse()

    const pendingItems = await loadPendingTimeItems(supabase, structure.lessonIds)
    if (pendingItems instanceof NextResponse) return pendingItems

    const targets = buildEstimationTargets(structure, pendingItems)
    if (targets.length === 0) return emptyTargetsResponse()

    const estimationResults = await CourseTimeEstimationService.estimateTargets(
      structure.course.title,
      targets,
      auth.userId,
    )
    const updateSummary = await applyEstimationResults(
      supabase,
      pendingItems,
      estimationResults,
    )
    const sourceCounts = countEstimationSources(estimationResults)

    return estimationSuccessResponse(updateSummary, sourceCounts)
  } catch (error) {
    return estimationErrorResponse(error)
  }
}

export async function GET(
  _request: NextRequest,
  { params }: EstimateRouteContext,
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: courseId } = await params
  return estimationInfoResponse(courseId)
}
