import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../../features/courses/services/course.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { ContentTranslationService } from '@/core/services/contentTranslation.service'
import { SupportedLanguage } from '@/core/i18n/i18n'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const currentUser = await SessionService.getCurrentUser()
    // Obtener idioma del usuario desde query params o header
    const language = (searchParams.get('lang') || 'es') as SupportedLanguage

    const course = await CourseService.getCourseBySlug(slug, currentUser?.id)

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Aplicar traducciones si es necesario
    if (course.id) {
      const supabase = await createClient()
      const courseWithId = { ...course, id: course.id }
      
      // Traducir título y descripción
      const fieldsToTranslate = ['title']
      if (course.description) fieldsToTranslate.push('description')
      
      const translatedCourse = await ContentTranslationService.translateObject(
        'course',
        courseWithId,
        fieldsToTranslate,
        language,
        supabase
      )
      
      // Aplicar traducciones al objeto curso
      if (translatedCourse.title) course.title = translatedCourse.title
      if (translatedCourse.description) course.description = translatedCourse.description
    }

    return NextResponse.json(course)
  } catch (error) {
    logError('GET /api/courses/[slug]', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener detalles del curso'),
      { status: 500 }
    )
  }
}
