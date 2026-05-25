import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { CreateLessonData } from '@/features/admin/services/adminLessons.service'
import { apiError } from '@/lib/api/errors'

const createLessonBodySchema = z.record(z.unknown())

export function validateLessonRouteParams(
  moduleId: string,
  courseId: string,
): NextResponse | null {
  if (!moduleId) {
    return NextResponse.json(
      { success: false, error: 'Module ID es requerido' },
      { status: 400 },
    )
  }

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: 'Course ID es requerido' },
      { status: 400 },
    )
  }

  return null
}

export async function parseCreateLessonBody(
  request: NextRequest,
): Promise<CreateLessonData | NextResponse> {
  try {
    const rawBody = await request.text()
    const parsedJson = rawBody.trim() ? JSON.parse(rawBody) : {}
    const parsedBody = createLessonBodySchema.safeParse(parsedJson)

    if (!parsedBody.success) {
      return apiError(
        'VALIDATION_ERROR',
        'El cuerpo de la peticion no cumple el contrato esperado.',
        422,
        { details: parsedBody.error.flatten() },
      )
    }

    return parsedBody.data as CreateLessonData
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Error al parsear el cuerpo de la peticiÃ³n. Verifique que el formato JSON sea vÃ¡lido.',
      },
      { status: 400 },
    )
  }
}

export function validateCreateLessonBody(body: CreateLessonData): NextResponse | null {
  if (!body.lesson_title || body.lesson_title.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'El tÃ­tulo de la lecciÃ³n es requerido' },
      { status: 400 },
    )
  }

  if (!body.video_provider_id || body.video_provider_id.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'El ID del proveedor de video es requerido' },
      { status: 400 },
    )
  }

  if (!body.instructor_id || body.instructor_id.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'El ID del instructor es requerido' },
      { status: 400 },
    )
  }

  if (!body.duration_seconds || body.duration_seconds <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'La duraciÃ³n debe ser mayor a 0 segundos',
        details: 'El campo duration_seconds debe tener un valor positivo',
      },
      { status: 400 },
    )
  }

  const validProviders = ['youtube', 'vimeo', 'direct', 'custom']
  if (!body.video_provider || !validProviders.includes(body.video_provider)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Proveedor de video invÃ¡lido',
        details: `El proveedor debe ser uno de: ${validProviders.join(', ')}`,
      },
      { status: 400 },
    )
  }

  return null
}
