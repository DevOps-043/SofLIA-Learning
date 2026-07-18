import { NextRequest, NextResponse } from 'next/server'

import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { logger } from '@/lib/utils/logger'

import {
  updateLessonSchema,
  type UpdateLessonBody,
} from '../schema'
import {
  lessonRouteError,
  lessonRouteSuccess,
  resolveAdminLessonId,
  type LessonRouteContext,
} from './lesson-route.helpers'

export async function GET(
  _request: NextRequest,
  { params }: LessonRouteContext,
) {
  try {
    const lessonId = await resolveAdminLessonId(params)
    if (lessonId instanceof NextResponse) return lessonId

    const lesson = await AdminLessonsService.getLessonById(lessonId)
    if (!lesson) {
      return lessonRouteError('Lección no encontrada', 404)
    }

    return lessonRouteSuccess({ lesson })
  } catch {
    return apiError('GET_LESSON_FAILED', 'Error al obtener lección', 500)
  }
}

async function handlePut(
  _request: NextRequest,
  body: UpdateLessonBody,
  { params }: LessonRouteContext,
) {
  try {
    const lessonId = await resolveAdminLessonId(params)
    if (lessonId instanceof NextResponse) return lessonId

    const lesson = await AdminLessonsService.updateLesson(lessonId, body)
    return lessonRouteSuccess({ lesson })
  } catch (error) {
    logger.error('[AdminLessons] Error actualizando leccion:', error)
    return apiError('UPDATE_LESSON_FAILED', 'Error al actualizar lección', 500)
  }
}

export const PUT = withZodBody(updateLessonSchema, handlePut)

export async function DELETE(
  _request: NextRequest,
  { params }: LessonRouteContext,
) {
  try {
    const lessonId = await resolveAdminLessonId(params)
    if (lessonId instanceof NextResponse) return lessonId

    await AdminLessonsService.deleteLesson(lessonId)
    return lessonRouteSuccess({ message: 'Lección eliminada correctamente' })
  } catch (error) {
    logger.error('[AdminLessons] Error eliminando leccion:', error)
    return apiError('DELETE_LESSON_FAILED', 'Error al eliminar lección', 500)
  }
}
