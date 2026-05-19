import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { SessionService } from '../../../../features/auth/services/session.service'
import { UserContextService } from '../../../../features/study-planner/services/user-context.service'
import {
  buildPlannedCourseKey,
  getUserPlannedCourseKeys,
} from '@/features/study-planner/services/study-planner-plans.server.service'
import { getTimeOfDay } from './save-plan-time.service'
import {
  createAdminClient,
  normalizeOrganizationId,
} from './save-plan-organization.service'
import {
  buildStudyPlanInsertPayload,
  buildStudyPreferencesPayload,
} from './save-plan-payload.service'
import {
  buildSessionsToInsert,
  formatInvalidSessionsError,
  mapCreatedSessions,
} from './save-plan-sessions.service'
import {
  findExistingStudySessionConflict,
  findInPayloadSessionConflict,
  formatSavePlanConflictError,
} from './save-plan-conflicts.service'
import type {
  CreatedStudySessionRow,
  SavePlanResponse,
} from './save-plan.types'
import {
  resolvePlanOrganization,
  validateSavePlanRequest,
} from './save-plan-validation.service'
import { savePlanSchema, type SavePlanBody } from '../_schemas'

async function handlePost(
  _request: NextRequest,
  body: SavePlanBody,
): Promise<NextResponse<SavePlanResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const validationError = validateSavePlanRequest(body)

    if (validationError) {
      return apiError('SAVE_PLAN_VALIDATION_FAILED', validationError, 400)
    }

    const supabase = createAdminClient()
    let userType = body.config.userType
    let organizationId: string | null = null

    if (!userType) {
      userType = await UserContextService.getUserType(user.id)
    }

    if (userType === 'b2b') {
      const requestedOrganizationId = normalizeOrganizationId(body.config.organizationId)
      const selectedCourseId = body.config.courseIds[0]

      organizationId = await resolvePlanOrganization({
        requestedOrganizationId,
        selectedCourseId,
        supabase,
        userId: user.id,
      })

      if (requestedOrganizationId && !organizationId) {
        return NextResponse.json(
          {
            success: false,
            error: 'No tienes una membresia activa en la organizacion seleccionada.',
          },
          { status: 403 },
        )
      }
    }

    const plannedCourseKeys = await getUserPlannedCourseKeys(user.id)
    const duplicateCourseId = body.config.courseIds.find((courseId) =>
      plannedCourseKeys.has(buildPlannedCourseKey(courseId, organizationId)),
    )

    if (duplicateCourseId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ya existe un plan activo para este curso. Selecciona otro curso o modifica el plan existente.',
        },
        { status: 409 },
      )
    }

    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert(
        buildStudyPlanInsertPayload({
          config: body.config,
          userId: user.id,
          userType,
          organizationId,
        }),
      )
      .select('id')
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al crear el plan de estudio: ${planError?.message || 'No se pudo crear el plan.'}`,
        },
        { status: 500 },
      )
    }

    const { sessionsToInsert, invalidSessions } = buildSessionsToInsert({
      sessions: body.sessions,
      planId: plan.id,
      userId: user.id,
      organizationId,
    })

    if (invalidSessions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Se encontraron ${invalidSessions.length} sesion(es) invalida(s). ${formatInvalidSessionsError(invalidSessions)}`,
        },
        { status: 400 },
      )
    }

    if (!sessionsToInsert.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay sesiones validas para guardar despues de la validacion.',
        },
        { status: 400 },
      )
    }

    const inPayloadConflict = findInPayloadSessionConflict(sessionsToInsert)
    if (inPayloadConflict) {
      await supabase.from('study_plans').delete().eq('id', plan.id)
      return NextResponse.json(
        {
          success: false,
          error: formatSavePlanConflictError(inPayloadConflict),
        },
        { status: 409 },
      )
    }

    const existingSessionConflict = await findExistingStudySessionConflict({
      supabase,
      userId: user.id,
      sessions: sessionsToInsert,
    })

    if (existingSessionConflict) {
      await supabase.from('study_plans').delete().eq('id', plan.id)
      return NextResponse.json(
        {
          success: false,
          error: formatSavePlanConflictError(existingSessionConflict),
        },
        { status: 409 },
      )
    }

    const { data: createdSessionsData, error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)
      .select('id, start_time, end_time, metrics')

    if (sessionsError) {
      await supabase.from('study_plans').delete().eq('id', plan.id)
      return NextResponse.json(
        {
          success: false,
          error: `Error al crear las sesiones del plan: ${sessionsError.message}`,
        },
        { status: 500 },
      )
    }

    const createdSessions = (createdSessionsData || []) as CreatedStudySessionRow[]

    await supabase.from('study_preferences').upsert(
      buildStudyPreferencesPayload({
        config: body.config,
        preferredTimeOfDay: getTimeOfDay(body.config.preferredTimeBlocks),
        userId: user.id,
      }),
      {
        onConflict: 'user_id',
      },
    )

    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        sessionsCreated: createdSessions.length,
        sessionIds: createdSessions.map((session) => session.id),
        sessions: mapCreatedSessions(createdSessions),
      },
    })
  } catch (error) {
    return apiError(
      'SAVE_PLAN_FAILED',
      error instanceof Error ? error.message : 'Error interno del servidor',
      500,
    )
  }
}

export const POST = withZodBody(savePlanSchema, handlePost)
