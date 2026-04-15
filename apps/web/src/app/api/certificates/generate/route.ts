import { NextRequest, NextResponse } from 'next/server'

import { CertificateService } from '@/core/services/certificate.service'
import { SessionService } from '@/features/auth/services/session.service'
import { hasActiveOrganizationMembership } from '@/features/certificates/services/certificate-organization.server'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

/**
 * POST /api/certificates/generate
 * Genera un certificado para un curso completado.
 * El usuario debe haber completado el curso y enviado su reseña.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const {
      course_id: rawCourseId,
      enrollment_id: rawEnrollmentId,
      organization_id: rawOrganizationId,
    } = body as {
      course_id?: unknown
      enrollment_id?: unknown
      organization_id?: unknown
    }

    const courseId = normalizeNullableString(rawCourseId)
    const requestedEnrollmentId = normalizeNullableString(rawEnrollmentId)
    const requestedOrganizationId = normalizeNullableString(rawOrganizationId)

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id es requerido' },
        { status: 400 },
      )
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
      return NextResponse.json(
        { error: 'La organizacion solicitada no corresponde al usuario actual' },
        { status: 403 },
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
      const { data: explicitEnrollment, error: explicitEnrollmentError } = await supabase
        .from('user_course_enrollments')
        .select(
          'enrollment_id, overall_progress_percentage, enrollment_status, organization_id',
        )
        .eq('enrollment_id', requestedEnrollmentId)
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (explicitEnrollmentError) {
        return NextResponse.json(
          { error: 'Error al validar la inscripcion del certificado' },
          { status: 500 },
        )
      }

      if (
        explicitEnrollment &&
        requestedOrganizationId &&
        explicitEnrollment.organization_id &&
        explicitEnrollment.organization_id !== requestedOrganizationId
      ) {
        return NextResponse.json(
          { error: 'La inscripcion no coincide con la organizacion solicitada' },
          { status: 409 },
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
      return NextResponse.json(
        { error: 'No estas inscrito en este curso' },
        { status: 404 },
      )
    }

    if (
      enrollment.enrollment_status !== 'completed' &&
      (enrollment.overall_progress_percentage ?? 0) < 100
    ) {
      return NextResponse.json(
        { error: 'Debes completar el curso al 100% para obtener un certificado' },
        { status: 400 },
      )
    }

    const { data: existingCertificate, error: existingCertificateError } = await supabase
      .from('user_course_certificates')
      .select('certificate_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existingCertificateError) {
      return NextResponse.json(
        { error: 'Error al validar el certificado existente' },
        { status: 500 },
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
        logger.error('Error verificando reseña del curso:', reviewError)
        return NextResponse.json(
          { error: 'Error al validar la reseña del curso' },
          { status: 500 },
        )
      }

      if (!review) {
        return NextResponse.json(
          { error: 'Debes calificar el curso antes de generar el certificado' },
          { status: 403 },
        )
      }

      const { data: courseInfo } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .single()

      if (!courseInfo) {
        return NextResponse.json(
          { error: 'Curso no encontrado' },
          { status: 404 },
        )
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
    return NextResponse.json(
      {
        error: 'Error al generar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
