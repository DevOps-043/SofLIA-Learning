import { NextResponse } from 'next/server'
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers'

export function courseNotFoundResponse() {
  return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
}

export function lessonNotFoundResponse() {
  return NextResponse.json(
    { error: 'Leccion no encontrada o no pertenece al curso' },
    { status: 404 },
  )
}

export function activitiesLoadErrorResponse() {
  return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 })
}

export function materialsLoadErrorResponse() {
  return NextResponse.json({ error: 'Error al obtener materiales' }, { status: 500 })
}

export function learningPathLockedResponse(learningPathState: unknown) {
  return withCacheHeaders(
    NextResponse.json(
      {
        error: 'CURSO_BLOQUEADO_POR_LEARNING_PATH',
        message: 'Este taller aún está bloqueado dentro de su learning path.',
        learningPath: learningPathState,
      },
      { status: 423 },
    ),
    cacheHeaders.dynamic,
  )
}
