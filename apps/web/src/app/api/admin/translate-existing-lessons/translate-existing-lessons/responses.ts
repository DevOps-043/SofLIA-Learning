import { NextResponse } from 'next/server'
import { createEmptySummary } from './reports'
import type { processLessonsForTranslation } from './processor'

type TranslationResult = Awaited<ReturnType<typeof processLessonsForTranslation>>

export function createNoLessonsResponse() {
  return NextResponse.json({
    success: true,
    message: 'No se encontraron lecciones para procesar',
    summary: createEmptySummary(),
    reportByCourse: [],
    details: [],
  })
}

export function createTranslationSuccessResponse(result: TranslationResult) {
  return NextResponse.json({
    success: true,
    message: `Procesadas ${result.summary.totalEntities} entidades de contenido`,
    summary: result.summary,
    reportByCourse: result.reportByCourse,
    details: result.details,
  })
}
