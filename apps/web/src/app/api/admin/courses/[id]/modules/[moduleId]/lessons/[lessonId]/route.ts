import { NextRequest, NextResponse } from 'next/server'

import { AdminLessonsService, UpdateLessonData } from '@/features/admin/services/adminLessons.service'
import {
  lessonRouteError,
  lessonRouteSuccess,
  resolveAdminLessonId,
  type LessonRouteContext,
} from './lesson-route.helpers'

export async function GET(
  request: NextRequest,
  { params }: LessonRouteContext,
) {
  try {
    const lessonId = await resolveAdminLessonId(params)
    if (lessonId instanceof NextResponse) return lessonId

    const lesson = await AdminLessonsService.getLessonById(lessonId)

    if (!lesson) {
      return lessonRouteError('LecciÃ³n no encontrada', 404)
    }

    return lessonRouteSuccess({ lesson })
  } catch (error) {
    return lessonRouteError('Error al obtener lecciÃ³n')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: LessonRouteContext,
) {
  try {
    const lessonId = await resolveAdminLessonId(params)
    if (lessonId instanceof NextResponse) return lessonId

    const body = await request.json() as UpdateLessonData
    const lesson = await AdminLessonsService.updateLesson(lessonId, body)

    return lessonRouteSuccess({ lesson })
  } catch (error) {
    return lessonRouteError('Error al actualizar lecciÃ³n')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: LessonRouteContext,
) {
  try {
    const lessonId = await resolveAdminLessonId(params)
    if (lessonId instanceof NextResponse) return lessonId

    await AdminLessonsService.deleteLesson(lessonId)

    return lessonRouteSuccess({ message: 'LecciÃ³n eliminada correctamente' })
  } catch (error) {
    return lessonRouteError('Error al eliminar lecciÃ³n')
  }
}
