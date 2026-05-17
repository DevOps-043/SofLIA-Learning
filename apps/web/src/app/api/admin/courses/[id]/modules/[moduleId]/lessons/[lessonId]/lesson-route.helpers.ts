import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'

export interface LessonRouteContext {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>
}

export async function resolveAdminLessonId(
  params: LessonRouteContext['params'],
): Promise<string | NextResponse> {
  const auth = await requireAdmin()

  if (auth instanceof NextResponse) {
    return auth
  }

  const { lessonId } = await params

  if (!lessonId) {
    return NextResponse.json({ error: 'Lesson ID es requerido' }, { status: 400 })
  }

  return lessonId
}

export function lessonRouteError(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status })
}

export function lessonRouteSuccess<T extends Record<string, unknown>>(payload: T) {
  return NextResponse.json({
    success: true,
    ...payload,
  })
}
