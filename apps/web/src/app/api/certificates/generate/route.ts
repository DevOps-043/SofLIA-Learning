import { NextRequest, NextResponse } from 'next/server'

import { CertificateService } from '@/core/services/certificate.service'
import { SessionService } from '@/features/auth/services/session.service'
import { hasActiveOrganizationMembership } from '@/features/certificates/services/certificate-organization.server'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import {
  generateCertificateSchema,
  type GenerateCertificateBody,
} from './schema'

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

/**
 * POST /api/certificates/generate
 * Genera un certificado para un curso completado.
 */
async function handlePost(
  request: NextRequest,
  body: GenerateCertificateBody,
) {
  try {
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    const {
      course_id: rawCourseId,
      enrollment_id: rawEnrollmentId,
      organization_id: rawOrganizationId,
    } = body

    const courseId = normalizeNullableString(rawCourseId)
    const requestedEnrollmentId = normalizeNullableString(rawEnrollmentId)
    const requestedOrganizationId = normalizeNullableString(rawOrganizationId)

    if (!courseId) {
      return apiError('COURSE_ID_REQUIRED', 'course_id es requerido', 400)
    }

    const supabase = createAdminClient()

    if (
      requestedOrganizationId &&
      !(await hasActiveOrganizationMembership(
        supabase,
        currentUser.id,
        requestedOrganizationId,
      ))
    ) {
      return apiError(
        'ORGANIZATION_FORBIDDEN',
        'La organizacion solicitada no corresponde al usuario actual',
        403,
      )
    }

    let enrollment:
      | {
          enrollment_id: string
          overall_progress_percentage: number | null
          enrollment_status: string | null
          organization_id: string | null
        }
      | null = null

    if (requestedEnrollmentId) {
      const { data: explicitEnrollment, error: explicitEnrollmentError } =
        await supabase
          .from('user_course_enrollments')
          .select(
            'enrollment_id, overall_progress_percentage, enrollment_status, organization_id',
          )
          .eq('enrollment_id', requestedEnrollmentId)
          .eq('user_id', currentUser.id)
          .eq('course_id', courseId)
          .maybeSingle()

      if (explicitEnrollmentError) {
        return apiError(
          'CERTIFICATE_ENROLLMENT_VALIDATION_FAILED',
          'Error al validar la inscripcion del certificado',
          500,
        )
      }

      if (
        explicitEnrollment &&
        requestedOrganizationId &&
        explicitEnrollment.organization_id &&
        explicitEnrollment.organization_id !== requestedOrganizationId
      ) {
        return apiError(
          'CERTIFICATE_ENROLLMENT_ORGANIZATION_MISMATCH',
          'La inscripcion no coincide con la organizacion solicitada',
          409,
        )
      }

      enrollment = explicitEnrollment
    }

    if (!enrollment) {
      enrollment = await resolveCourseEnrollment(
        supabase,
        currentUser.id,
        courseId,
        requestedOrganizationId,
      )
    }

    if (!enrollment) {
      return apiError(
        'COURSE_ENROLLMENT_NOT_FOUND',
        'No estas inscrito en este curso',
        404,
      )
    }

    if (
      enrollment.enrollment_status !== 'completed' &&
      (enrollment.overall_progress_percentage ?? 0) < 100
    ) {
      return apiError(
        'COURSE_NOT_COMPLETED',
        'Debes completar el curso al 100% para obtener un certificado',
        400,
      )
    }

    const { data: existingCertificate, error: existingCertificateError } =
      await supabase
        .from('user_course_certificates')
        .select('certificate_id')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .maybeSingle()

    if (existingCertificateError) {
      return apiError(
        'CERTIFICATE_LOOKUP_FAILED',
        'Error al validar el certificado existente',
        500,
      )
    }

    if (!existingCertificate) {
      const { data: review, error: reviewError } = await supabase
        .from('course_reviews')
        .select('review_id')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .single()

      if (reviewError && reviewError.code !== 'PGRST116') {
        logger.error('Error verificando resena del curso:', reviewError)
        return apiError(
          'COURSE_REVIEW_VALIDATION_FAILED',
          'Error al validar la resena del curso',
          500,
        )
      }

      if (!review) {
        return apiError(
          'COURSE_REVIEW_REQUIRED',
          'Debes calificar el curso antes de generar el certificado',
          403,
        )
      }

      const { data: courseInfo } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single()

      if (!courseInfo) {
        return apiError('COURSE_NOT_FOUND', 'Curso no encontrado', 404)
      }
    }

    const issuedCertificate = await CertificateService.issueCourseCertificate({
      userId: currentUser.id,
      courseId,
      enrollmentId: enrollment.enrollment_id,
      organizationId: requestedOrganizationId,
      cookieHeader: request.headers.get('cookie'),
    })

    logger.log(`Certificado generado: ${issuedCertificate.certificateId}`)

    const { data: notificationCourse } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle()

    const courseTitle = notificationCourse?.title || 'tu curso'
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )

    await AutoNotificationsService.notifyCertificateGenerated(
      currentUser.id,
      courseTitle,
      issuedCertificate.certificateId,
      {
        action_url: '/profile?tab=certificates',
        certificate_url: issuedCertificate.certificateUrl,
        course_id: courseId,
        organization_id:
          requestedOrganizationId || enrollment.organization_id || undefined,
        source: existingCertificate ? 'certificate_repair' : 'certificate_generate',
      },
    )

    return NextResponse.json({
      success: true,
      message: existingCertificate
        ? 'Certificado reparado y disponible'
        : 'Certificado generado exitosamente',
      certificate_id: issuedCertificate.certificateId,
      certificate_url: issuedCertificate.certificateUrl,
    })
  } catch (error) {
    logger.error('Error en /api/certificates/generate:', error)
    return apiError(
      'CERTIFICATE_GENERATION_FAILED',
      'Error al generar certificado',
      500,
    )
  }
}

export const POST = withZodBody(generateCertificateSchema, handlePost)
