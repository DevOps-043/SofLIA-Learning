import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import {
  buildCertificateSnapshots,
  toCertificateJson,
} from '@/features/certificates/services/certificate-document.service'
import { CertificateDataService } from '@/features/certificates/services/certificate-data.server'
import { getPrimaryOrganizationIdForUser } from '@/features/certificates/services/certificate-organization.server'
import { CertificatePdfService } from '@/features/certificates/services/certificate-pdf.server'

interface IssueCertificateParams {
  userId: string
  courseId: string
  enrollmentId: string
  organizationId?: string | null
  cookieHeader?: string | null
}

interface UserProfileRow {
  display_name: string | null
  first_name: string | null
  last_name: string | null
  username: string
}

interface InstructorProfileRow extends UserProfileRow {
  signature_name: string | null
  signature_url: string | null
}

interface SupabaseErrorLike {
  code?: string | null
  message?: string | null
  details?: string | null
}

function resolveDisplayName(
  profile: UserProfileRow | null | undefined,
  fallback: string,
): string {
  if (!profile) {
    return fallback
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  return profile.display_name || fullName || profile.username || fallback
}

function isMissingSnapshotColumnsError(error: unknown): error is SupabaseErrorLike {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as SupabaseErrorLike
  const haystack = `${candidate.message || ''} ${candidate.details || ''}`.toLowerCase()

  return (
    haystack.includes('branding_snapshot') ||
    haystack.includes('document_snapshot') ||
    candidate.code === 'PGRST204'
  )
}

export class CertificateService {
  static async issueCourseCertificate(params: IssueCertificateParams): Promise<{
    certificateId: string
    certificateUrl: string
    certificateHash: string
  }> {
    const { userId, courseId, enrollmentId } = params
    const supabase = createAdminClient()

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('organization_id')
      .eq('enrollment_id', enrollmentId)
      .eq('user_id', userId)
      .single()

    if (enrollmentError || !enrollment) {
      throw enrollmentError || new Error('No se encontro la inscripcion del certificado')
    }

    const resolvedOrganizationId =
      enrollment.organization_id ||
      params.organizationId ||
      await getPrimaryOrganizationIdForUser(supabase, userId)

    const { data: existingCertificate, error: existingCertificateError } = await supabase
      .from('user_course_certificates')
      .select(
        'certificate_id, certificate_url, certificate_hash, organization_id, enrollment_id',
      )
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existingCertificateError) {
      throw existingCertificateError
    }

    let certificateId = existingCertificate?.certificate_id || randomUUID()
    let certificateHash = existingCertificate?.certificate_hash || ''
    let shouldRegeneratePdf = !existingCertificate?.certificate_url

    if (existingCertificate) {
      const shouldRefreshExistingCertificateContext =
        existingCertificate.enrollment_id !== enrollmentId ||
        (existingCertificate.organization_id || null) !== (resolvedOrganizationId || null)

      if (shouldRefreshExistingCertificateContext) {
        const { error: updateError } = await supabase
          .from('user_course_certificates')
          .update({
            enrollment_id: enrollmentId,
            organization_id: resolvedOrganizationId,
            template_id: null,
          })
          .eq('certificate_id', existingCertificate.certificate_id)

        if (updateError) {
          throw updateError
        }

        shouldRegeneratePdf = true
      }
    } else {
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title, instructor_id')
        .eq('id', courseId)
        .single()

      if (courseError || !course) {
        throw courseError || new Error('No se encontro el curso del certificado')
      }

      const { data: userProfile, error: userProfileError } = await supabase
        .from('users')
        .select('display_name, first_name, last_name, username')
        .eq('id', userId)
        .single()

      if (userProfileError || !userProfile) {
        throw userProfileError || new Error('No se encontro el usuario del certificado')
      }

      let instructorProfile: InstructorProfileRow | null = null
      if (course.instructor_id) {
        const { data: instructorData, error: instructorError } = await supabase
          .from('users')
          .select('display_name, first_name, last_name, username, signature_name, signature_url')
          .eq('id', course.instructor_id)
          .single()

        if (instructorError && instructorError.code !== 'PGRST116') {
          throw instructorError
        }

        instructorProfile = (instructorData as InstructorProfileRow | null) || null
      }

      const { data: organization } = resolvedOrganizationId
        ? await supabase
            .from('organizations')
            .select(
              'id, name, logo_url, brand_logo_url, brand_color_primary, brand_color_accent, brand_color_secondary',
            )
            .eq('id', resolvedOrganizationId)
            .single()
        : { data: null }

      const { data: template } = resolvedOrganizationId
        ? await supabase
            .from('certificate_templates')
            .select('id, design_config')
            .eq('organization_id', resolvedOrganizationId)
            .eq('is_active', true)
            .eq('is_default', true)
            .maybeSingle()
        : { data: null }

      const issuedAt = new Date().toISOString()
      const predictedStoragePath = CertificatePdfService.buildStoragePath(userId, certificateId)
      const predictedCertificateUrl = await CertificatePdfService.buildPublicUrl(predictedStoragePath)

      const snapshots = buildCertificateSnapshots({
        organizationId: resolvedOrganizationId,
        organizationName: organization?.name || null,
        organizationLogoUrl: organization?.brand_logo_url || organization?.logo_url || null,
        organizationPrimaryColor: organization?.brand_color_primary || null,
        organizationAccentColor: organization?.brand_color_accent || null,
        organizationSecondaryColor: organization?.brand_color_secondary || null,
        templateId: template?.id || null,
        templateDesignConfig: template?.design_config || null,
        learnerName: resolveDisplayName(userProfile, 'Estudiante'),
        courseTitle: course.title,
        instructorName: resolveDisplayName(instructorProfile, 'Instructor'),
        instructorSignatureUrl: instructorProfile?.signature_url || null,
        instructorSignatureName: instructorProfile?.signature_name || null,
        issuedAt,
      })

      const baseInsertPayload = {
        certificate_id: certificateId,
        user_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        certificate_url: predictedCertificateUrl,
        issued_at: issuedAt,
        organization_id: resolvedOrganizationId,
        template_id: template?.id || null,
      }

      const firstInsertAttempt = await supabase
        .from('user_course_certificates')
        .insert({
          ...baseInsertPayload,
          branding_snapshot: toCertificateJson(snapshots.brandingSnapshot),
          document_snapshot: toCertificateJson(snapshots.documentSnapshot),
        })
        .select('certificate_hash')
        .single()

      if (firstInsertAttempt.error && isMissingSnapshotColumnsError(firstInsertAttempt.error)) {
        const fallbackInsertAttempt = await supabase
          .from('user_course_certificates')
          .insert(baseInsertPayload)
          .select('certificate_hash')
          .single()

        if (fallbackInsertAttempt.error || !fallbackInsertAttempt.data) {
          throw fallbackInsertAttempt.error || new Error('No se pudo crear el certificado')
        }

        certificateHash = fallbackInsertAttempt.data.certificate_hash || ''
      } else if (firstInsertAttempt.error || !firstInsertAttempt.data) {
        throw firstInsertAttempt.error || new Error('No se pudo crear el certificado')
      } else {
        certificateHash = firstInsertAttempt.data.certificate_hash || ''
      }

      if (!certificateHash) {
        const { data: generatedHash, error: hashError } = await supabase.rpc('certificate_hash_immutable', {
          p_certificate_id: certificateId,
          p_certificate_url: predictedCertificateUrl,
          p_course_id: courseId,
          p_enrollment_id: enrollmentId,
          p_issued_at: issuedAt,
          p_user_id: userId,
        })

        if (hashError) {
          throw hashError
        }

        if (typeof generatedHash !== 'string' || generatedHash.trim().length === 0) {
          throw new Error('No se pudo generar el hash del certificado')
        }

        certificateHash = generatedHash

        await supabase
          .from('user_course_certificates')
          .update({ certificate_hash: certificateHash })
          .eq('certificate_id', certificateId)
      }

      shouldRegeneratePdf = true
    }

    logger.log('Certificado emitido con renderer unificado', {
      certificateId,
      courseId,
      userId,
      organizationId: resolvedOrganizationId,
    })

    const resolvedCertificate = await CertificateDataService.getUserCertificateById(userId, certificateId)

    if (!resolvedCertificate) {
      throw new Error('El certificado no se pudo confirmar en la base de datos')
    }

    let certificateUrl =
      resolvedCertificate.certificateUrl ||
      (await CertificatePdfService.buildPublicUrl(
        CertificatePdfService.buildStoragePath(userId, certificateId),
      ))

    try {
      const ensuredPdf = await CertificatePdfService.ensureStoredPdf({
        userId,
        certificateId,
        cookieHeader: params.cookieHeader,
        forceRegenerate: shouldRegeneratePdf,
      })

      certificateUrl = ensuredPdf.publicUrl
    } catch (pdfError) {
      logger.error('Error asegurando PDF de certificado; se mantiene el registro emitido', {
        certificateId,
        courseId,
        userId,
        error: pdfError instanceof Error ? pdfError.message : 'Error desconocido',
      })
    }

    return {
      certificateId: resolvedCertificate.certificateId,
      certificateUrl,
      certificateHash: resolvedCertificate.certificateHash || certificateHash,
    }
  }
}
