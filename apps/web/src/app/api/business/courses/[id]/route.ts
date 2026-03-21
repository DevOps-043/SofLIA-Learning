import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) {
      logger.error('❌ Authentication failed in /api/business/courses/[id]')
      return auth
    }

    const { id } = await params
    logger.info(`🔍 Fetching course with ID: ${id}`)

    if (!id || id === 'undefined' || id === 'null') {
      logger.error('❌ Invalid course ID:', id)
      return NextResponse.json({
        success: false,
        error: 'ID de curso no válido'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Obtener información del curso (buscar por ID)
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        instructor_id,
        duration_total_minutes,
        thumbnail_url,
        slug,
        is_active,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    if (courseError) {
      logger.error('❌ Error fetching course:', {
        error: courseError,
        code: courseError.code,
        message: courseError.message,
        details: courseError.details,
        hint: courseError.hint,
        courseId: id
      })

      if (courseError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: `Curso con ID "${id}" no encontrado en la base de datos`
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        error: `Error al obtener el curso: ${courseError.message || 'Error desconocido'}`
      }, { status: 500 })
    }

    if (!course) {
      logger.error('❌ Course not found (null result):', id)
      return NextResponse.json({
        success: false,
        error: `Curso con ID "${id}" no encontrado`
      }, { status: 404 })
    }

    logger.info(`✅ Course found: ${course.title} (${course.id})`)

    // Obtener información del instructor
    let instructor = null
    let instructorId = course.instructor_id

    // Si el curso no tiene instructor_id, intentar obtenerlo de la primera lección
    if (!instructorId) {
      logger.info('🔍 Course has no instructor_id, trying to get from first lesson...')

      // Obtener el primer módulo
      const { data: firstModule } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('module_order_index', { ascending: true })
        .limit(1)
        .single()

      if (firstModule) {
        // Obtener la primera lección del primer módulo
        const { data: firstLesson } = await supabase
          .from('course_lessons')
          .select('instructor_id')
          .eq('module_id', firstModule.module_id)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true })
          .limit(1)
          .single()

        if (firstLesson?.instructor_id) {
          instructorId = firstLesson.instructor_id
          logger.info(`✅ Found instructor_id from first lesson: ${instructorId}`)
        }
      }
    }

    if (instructorId) {
      const { data: instructorData, error: instructorError } = await supabase
        .from('users')
        .select('id, first_name, last_name, display_name, username, email, profile_picture_url, bio, linkedin_url, github_url, website_url, location, cargo_rol, type_rol')
        .eq('id', instructorId)
        .single()

      if (!instructorError && instructorData) {
        const name = instructorData.display_name ||
          `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim() ||
          instructorData.username ||
          'Instructor'

        instructor = {
          id: instructorData.id,
          name,
          email: instructorData.email || '',
          profile_picture_url: instructorData.profile_picture_url,
          bio: instructorData.bio,
          linkedin_url: instructorData.linkedin_url,
          github_url: instructorData.github_url,
          website_url: instructorData.website_url,
          location: instructorData.location,
          cargo_rol: instructorData.cargo_rol,
          type_rol: instructorData.type_rol
        }
        logger.info(`✅ Instructor loaded: ${name}`)
      } else {
        logger.warn('⚠️ Could not load instructor data:', instructorError)
      }
    } else {
      logger.warn('⚠️ No instructor_id found for course or lessons')
    }

    // Obtener módulos del curso (usar course.id, no el parámetro id)
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_description,
        module_order_index,
        module_duration_minutes,
        is_required,
        is_published
      `)
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true })

    // Obtener lecciones para cada módulo
    const modulesWithLessons = await Promise.all(
      (modules || []).map(async (module: any) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            total_duration_minutes,
            video_provider,
            video_provider_id,
            is_published
          `)
          .eq('module_id', module.module_id)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true })

        const lessonsList = lessons || []
        const lessonIds = lessonsList.map((l: any) => l.lesson_id)

        // Calcular duración usando total_duration_minutes de cada lección (prioridad)
        // Este campo ya incluye video + materiales + actividades
        let totalModuleDuration = 0
        let hasLessonTotalDuration = false

        // Primero, intentar usar total_duration_minutes de cada lección
        for (const lesson of lessonsList) {
          if (lesson.total_duration_minutes && lesson.total_duration_minutes > 0) {
            totalModuleDuration += lesson.total_duration_minutes
            hasLessonTotalDuration = true
          } else if (lesson.duration_seconds && lesson.duration_seconds > 0) {
            // Fallback: usar duration_seconds si no hay total_duration_minutes
            totalModuleDuration += Math.ceil(lesson.duration_seconds / 60)
          }
        }

        // Si ninguna lección tiene total_duration_minutes, calcular manualmente
        if (!hasLessonTotalDuration && lessonIds.length > 0) {
          // Obtener tiempo de materiales
          const { data: materials } = await supabase
            .from('lesson_materials')
            .select('estimated_time_minutes')
            .in('lesson_id', lessonIds)

          const materialsMinutes = (materials || []).reduce((sum: number, m: any) =>
            sum + (m.estimated_time_minutes || 0), 0)

          // Obtener tiempo de actividades
          const { data: activities } = await supabase
            .from('lesson_activities')
            .select('estimated_time_minutes')
            .in('lesson_id', lessonIds)

          const activitiesMinutes = (activities || []).reduce((sum: number, a: any) =>
            sum + (a.estimated_time_minutes || 0), 0)

          totalModuleDuration += materialsMinutes + activitiesMinutes
        }

        return {
          ...module,
          lessons: lessonsList,
          // Guardar duración total calculada para uso en el frontend
          calculated_duration_minutes: totalModuleDuration
        }
      })
    )

    // Obtener reviews recientes (usar course.id, no el parámetro id)
    let reviews: any[] = []
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('course_reviews')
        .select(`
          review_id,
          review_title,
          review_content,
          rating,
          is_verified,
          created_at,
          user_id,
          users!inner (display_name, first_name, last_name, username, profile_picture_url)
        `)
        .eq('course_id', course.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (reviewsError) {
        logger.warn('⚠️ Error fetching reviews (non-critical):', reviewsError)
        reviews = []
      } else {
        reviews = reviewsData || []
      }
    } catch (reviewsErr) {
      logger.warn('⚠️ Exception fetching reviews (non-critical):', reviewsErr)
      reviews = []
    }

    // Calcular estadísticas de módulos y lecciones
    const totalModules = modulesWithLessons.length
    const totalLessons = modulesWithLessons.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0)
    // Usar calculated_duration_minutes que ya incluye videos + materiales + actividades
    const totalDuration = modulesWithLessons.reduce((sum: number, m: any) => {
      return sum + (m.calculated_duration_minutes || m.module_duration_minutes || 0)
    }, 0)

    // Verificar membresía y estado de compra a nivel de organización
    let hasSubscription = false
    let isOrganizationPurchased = false
    let canAssign = false
    let canPurchaseForFree = false
    let monthlyCourseCount = 0
    let maxCoursesPerPeriod = 10

    try {
      const currentUser = await SessionService.getCurrentUser()

      if (currentUser && auth.organizationId) {
        try {
          // Verificar membresía activa — pasar auth.organizationId para evitar resolución
          // incorrecta en usuarios pertenecientes a múltiples empresas
          hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id, auth.organizationId)
        } catch (subError) {
          logger.warn('⚠️ Error checking subscription (non-critical):', subError)
          hasSubscription = false
        }

        try {
          // Verificar si la organización ya compró el curso
          const { data: orgPurchase } = await supabase
            .from('organization_course_purchases')
            .select('purchase_id')
            .eq('organization_id', auth.organizationId)
            .eq('course_id', course.id)
            .eq('access_status', 'active')
            .maybeSingle()

          isOrganizationPurchased = !!orgPurchase

          // Si no está comprado, verificar si puede comprarlo gratis
          if (!isOrganizationPurchased && hasSubscription) {
            const limitCheck = await SubscriptionService.canOrganizationPurchaseCourse(
              auth.organizationId,
              10
            )
            canPurchaseForFree = limitCheck.canPurchase
            monthlyCourseCount = limitCheck.currentCount
            maxCoursesPerPeriod = limitCheck.maxCourses
          }

          canAssign = hasSubscription && isOrganizationPurchased
        } catch (purchaseError) {
          logger.warn('⚠️ Error checking organization purchase (non-critical):', purchaseError)
          isOrganizationPurchased = false
          canAssign = false
        }
      }
    } catch (userError) {
      logger.warn('⚠️ Error getting current user (non-critical):', userError)
      // Continuar sin información de usuario
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        instructor: instructor,
        duration: course.duration_total_minutes,
        thumbnail_url: course.thumbnail_url,
        slug: course.slug,
        price: course.price,
        rating: course.average_rating || 0,
        student_count: course.student_count || 0,
        review_count: course.review_count || 0,
        learning_objectives: course.learning_objectives || [],
        created_at: course.created_at,
        updated_at: course.updated_at,
        stats: {
          total_modules: totalModules,
          total_lessons: totalLessons,
          total_duration_minutes: totalDuration
        },
        modules: modulesWithLessons,
        reviews: (reviews || []).map((review: any) => ({
          id: review.review_id,
          title: review.review_title,
          content: review.review_content,
          rating: review.rating,
          is_verified: review.is_verified,
          created_at: review.created_at,
          user: {
            name: review.users?.display_name ||
              `${review.users?.first_name || ''} ${review.users?.last_name || ''}`.trim() ||
              review.users?.username ||
              'Usuario',
            profile_picture_url: review.users?.profile_picture_url
          }
        })) || [],
        subscription_status: {
          has_subscription: hasSubscription,
          is_purchased: isOrganizationPurchased, // Mantener para compatibilidad
          is_organization_purchased: isOrganizationPurchased,
          can_assign: canAssign,
          can_purchase_for_free: canPurchaseForFree,
          monthly_course_count: monthlyCourseCount,
          max_courses_per_period: maxCoursesPerPeriod
        }
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error('💥 Error details:', {
      message: errorMessage,
      stack: errorStack,
      error
    })

    return NextResponse.json({
      success: false,
      error: `Error al obtener detalles del curso: ${errorMessage}`
    }, { status: 500 })
  }
}

