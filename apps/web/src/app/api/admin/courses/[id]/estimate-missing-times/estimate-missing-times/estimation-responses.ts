import { NextResponse } from 'next/server'
import type { EstimationSourceCounts, EstimationUpdateSummary } from './estimation-results.types'

export function emptyModulesResponse() {
  return NextResponse.json({
    success: true,
    updated: 0,
    message: 'El curso no tiene modulos para estimar.',
  })
}

export function emptyLessonsResponse() {
  return NextResponse.json({
    success: true,
    updated: 0,
    message: 'El curso no tiene lecciones para estimar.',
  })
}

export function emptyTargetsResponse() {
  return NextResponse.json({
    success: true,
    updated: 0,
    message: 'No hay tiempos faltantes para estimar en este curso.',
  })
}

export function courseLoadErrorResponse(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status })
}

export function pendingItemsLoadErrorResponse() {
  return courseLoadErrorResponse(
    500,
    'No se pudieron obtener los materiales o actividades pendientes',
  )
}

export function estimationInfoResponse(courseId: string) {
  return NextResponse.json({
    success: true,
    courseId,
    endpoint: `/api/admin/courses/${courseId}/estimate-missing-times`,
    description: 'Estima tiempos faltantes de materiales y actividades, los guarda y recalcula duraciones.',
  })
}

export function estimationSuccessResponse(
  updateSummary: EstimationUpdateSummary,
  sourceCounts: EstimationSourceCounts,
) {
  const updated = updateSummary.updatedMaterials + updateSummary.updatedActivities

  return NextResponse.json({
    success: true,
    updated,
    updatedMaterials: updateSummary.updatedMaterials,
    updatedActivities: updateSummary.updatedActivities,
    recalculatedLessons: updateSummary.recalculatedLessons,
    recalculationErrors: updateSummary.recalculationErrors,
    geminiUpdatedCount: sourceCounts.geminiUpdatedCount,
    fallbackCount: sourceCounts.fallbackCount,
    message:
      updated > 0
        ? `Se estimaron y guardaron ${updated} tiempos faltantes.`
        : 'No fue necesario actualizar tiempos faltantes.',
  })
}

export function estimationErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al estimar tiempos faltantes',
    },
    { status: 500 },
  )
}
