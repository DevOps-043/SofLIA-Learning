import { getFullUrl } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/supabase/types'
import { SOFLIA_PLATFORM_BRAND } from '@/features/certificates/constants/certificate-branding'
import {
  buildCertificateDocumentModel,
  buildCertificateSnapshots,
  parseCertificateBrandingSnapshot,
  parseCertificateDocumentSnapshot,
  shouldRebuildSnapshots,
  toCertificateJson,
} from '@/features/certificates/services/certificate-document.service'
import {
  loadPrimaryOrganizationIdsMap,
  resolveEffectiveOrganizationId,
} from '@/features/certificates/services/certificate-organization.server'
import type {
  CertificateListItem,
  UserCourseCertificateRow,
} from '@/features/certificates/types/certificate'

type SupabaseServerClient = ReturnType<typeof createAdminClient>
type CertificateUpdate = Database['public']['Tables']['user_course_certificates']['Update']

interface SupabaseErrorLike {
  code?: string | null
  message?: string | null
  details?: string | null
}

interface QueryCertificatesResult {
  rows: CertificateRow[]
  supportsSnapshots: boolean
}

interface CertificateCourseRow {
  id: string
  title: string | null
  slug: string | null
  instructor_id: string | null
}

interface CertificateRow extends UserCourseCertificateRow {
  course_id: string
  user_id: string
  courses?: CertificateCourseRow | null
}

interface OrganizationRow {
  id: string
  name: string
  logo_url: string | null
  brand_logo_url: string | null
  brand_color_primary: string | null
  brand_color_accent: string | null
  brand_color_secondary: string | null
}

interface TemplateRow {
  id: string
  organization_id: string
  design_config: Json
  is_default: boolean | null
}

interface EnrollmentOrganizationRow {
  enrollment_id: string
  organization_id: string | null
}

interface UserProfileRow {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  username: string
  signature_name: string | null
  signature_url: string | null
}

function getDisplayName(user: UserProfileRow | null | undefined, fallback: string): string {
  if (!user) {
    return fallback
  }

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return user.display_name || fullName || user.username || fallback
}

function hasOwnKeys(value: CertificateUpdate): boolean {
  return Object.keys(value).length > 0
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

async function queryCertificates(
  supabase: SupabaseServerClient,
  filters: {
    userId?: string
    certificateId?: string
    certificateHash?: string
  },
): Promise<QueryCertificatesResult> {
  const buildQuery = (supportsSnapshots: boolean) => {
    const snapshotFields = supportsSnapshots
      ? `,
      branding_snapshot,
      document_snapshot`
      : ''

    let query = supabase
    .from('user_course_certificates')
    .select(`
      certificate_id,
      certificate_url,
      certificate_hash,
      issued_at,
      expires_at,
      created_at,
      course_id,
      enrollment_id,
      organization_id,
      template_id,
      user_id${snapshotFields},
      courses (
        id,
        title,
        slug,
        instructor_id
      )
    `)
      .order('issued_at', { ascending: false })

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.certificateId) {
      query = query.eq('certificate_id', filters.certificateId)
    }

    if (filters.certificateHash) {
      query = query.eq('certificate_hash', filters.certificateHash)
    }

    return query
  }

  const { data, error } = await buildQuery(true)

  if (!error) {
    return {
      rows: (data || []) as CertificateRow[],
      supportsSnapshots: true,
    }
  }

  if (!isMissingSnapshotColumnsError(error)) {
    throw error
  }

  const { data: fallbackData, error: fallbackError } = await buildQuery(false)

  if (fallbackError) {
    throw fallbackError
  }

  const rows = ((fallbackData || []) as Array<Omit<CertificateRow, 'branding_snapshot' | 'document_snapshot'>>).map(
    (row) => ({
      ...row,
      branding_snapshot: null,
      document_snapshot: null,
    }),
  )

  return {
    rows,
    supportsSnapshots: false,
  }
}

async function loadEnrollmentsMap(
  supabase: SupabaseServerClient,
  certificateRows: CertificateRow[],
): Promise<Map<string, string | null>> {
  const enrollmentIds = [...new Set(
    certificateRows
      .map((row) => row.enrollment_id)
      .filter((value): value is string => Boolean(value)),
  )]

  if (enrollmentIds.length === 0) {
    return new Map<string, string | null>()
  }

  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, organization_id')
    .in('enrollment_id', enrollmentIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as EnrollmentOrganizationRow[]).map((enrollment) => [
      enrollment.enrollment_id,
      enrollment.organization_id,
    ]),
  )
}

async function loadOrganizationsMap(
  supabase: SupabaseServerClient,
  organizationIds: string[],
): Promise<Map<string, OrganizationRow>> {
  if (organizationIds.length === 0) {
    return new Map<string, OrganizationRow>()
  }

  const { data, error } = await supabase
    .from('organizations')
    .select(
      'id, name, logo_url, brand_logo_url, brand_color_primary, brand_color_accent, brand_color_secondary',
    )
    .in('id', organizationIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as OrganizationRow[]).map((organization) => [organization.id, organization]),
  )
}

async function loadTemplates(
  supabase: SupabaseServerClient,
  certificateRows: CertificateRow[],
  organizationIds: string[],
): Promise<{
  explicitTemplates: Map<string, TemplateRow>
  defaultTemplates: Map<string, TemplateRow>
}> {
  const templateIds = certificateRows
    .map((row) => row.template_id)
    .filter((value): value is string => Boolean(value))

  const explicitTemplates = new Map<string, TemplateRow>()
  const defaultTemplates = new Map<string, TemplateRow>()

  if (templateIds.length > 0) {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('id, organization_id, design_config, is_default')
      .in('id', templateIds)

    if (error) {
      throw error
    }

    for (const template of (data || []) as TemplateRow[]) {
      explicitTemplates.set(template.id, template)
    }
  }

  if (organizationIds.length > 0) {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('id, organization_id, design_config, is_default')
      .in('organization_id', organizationIds)
      .eq('is_active', true)
      .eq('is_default', true)

    if (error) {
      throw error
    }

    for (const template of (data || []) as TemplateRow[]) {
      defaultTemplates.set(template.organization_id, template)
    }
  }

  return {
    explicitTemplates,
    defaultTemplates,
  }
}

async function loadUsersMap(
  supabase: SupabaseServerClient,
  userIds: string[],
): Promise<Map<string, UserProfileRow>> {
  if (userIds.length === 0) {
    return new Map<string, UserProfileRow>()
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, first_name, last_name, username, signature_name, signature_url')
    .in('id', userIds)

  if (error) {
    throw error
  }

  return new Map(
    ((data || []) as UserProfileRow[]).map((user) => [user.id, user]),
  )
}

async function ensureCertificateHash(
  supabase: SupabaseServerClient,
  row: CertificateRow,
): Promise<string> {
  if (row.certificate_hash) {
    return row.certificate_hash
  }

  const { data, error } = await supabase.rpc('certificate_hash_immutable', {
    p_certificate_id: row.certificate_id,
    p_certificate_url: row.certificate_url,
    p_course_id: row.course_id,
    p_enrollment_id: row.enrollment_id,
    p_issued_at: row.issued_at,
    p_user_id: row.user_id,
  })

  if (error) {
    throw error
  }

  const generatedHash = typeof data === 'string' ? data : ''
  if (!generatedHash) {
    throw new Error(`No se pudo generar hash para el certificado ${row.certificate_id}`)
  }

  await supabase
    .from('user_course_certificates')
    .update({ certificate_hash: generatedHash })
    .eq('certificate_id', row.certificate_id)

  row.certificate_hash = generatedHash
  return generatedHash
}

async function resolveCertificateRecord(
  supabase: SupabaseServerClient,
  row: CertificateRow,
  dependencies: {
    supportsSnapshots: boolean
    enrollmentOrganizations: Map<string, string | null>
    organizations: Map<string, OrganizationRow>
    primaryOrganizations: Map<string, string>
    explicitTemplates: Map<string, TemplateRow>
    defaultTemplates: Map<string, TemplateRow>
    users: Map<string, UserProfileRow>
  },
): Promise<CertificateListItem> {
  const learner = dependencies.users.get(row.user_id) || null
  const instructorId = row.courses?.instructor_id || null
  const instructor = instructorId ? dependencies.users.get(instructorId) || null : null
  const effectiveOrganizationId = resolveEffectiveOrganizationId({
    certificateOrganizationId: row.organization_id,
    enrollmentId: row.enrollment_id,
    enrollmentOrganizations: dependencies.enrollmentOrganizations,
    primaryOrganizations: dependencies.primaryOrganizations,
    userId: row.user_id,
  })

  const organization = effectiveOrganizationId
    ? dependencies.organizations.get(effectiveOrganizationId) || null
    : null

  const template =
    (row.template_id ? dependencies.explicitTemplates.get(row.template_id) : null) ||
    (effectiveOrganizationId ? dependencies.defaultTemplates.get(effectiveOrganizationId) : null) ||
    null

  let brandingSnapshot = parseCertificateBrandingSnapshot(row.branding_snapshot)
  let documentSnapshot = parseCertificateDocumentSnapshot(row.document_snapshot)

  const updatePayload: CertificateUpdate = {}
  const expectedPlatformLogoUrl = getFullUrl(SOFLIA_PLATFORM_BRAND.logoUrl)
  const expectedIssuerName = organization?.name || 'SofLIA'
  const expectedIssuerLogoUrl = organization?.brand_logo_url || organization?.logo_url || null
  const expectedProgramText = `Forma parte del programa de capacitación de ${expectedIssuerName}`
  const snapshotOrganizationMismatch =
    !brandingSnapshot ||
    brandingSnapshot.platform.name !== SOFLIA_PLATFORM_BRAND.name ||
    brandingSnapshot.platform.logoUrl !== expectedPlatformLogoUrl ||
    brandingSnapshot.issuer.organizationId !== effectiveOrganizationId ||
    brandingSnapshot.issuer.name !== expectedIssuerName ||
    (brandingSnapshot.issuer.logoUrl || null) !== expectedIssuerLogoUrl ||
    !documentSnapshot ||
    documentSnapshot.programText !== expectedProgramText

  if (shouldRebuildSnapshots(brandingSnapshot, documentSnapshot) || snapshotOrganizationMismatch) {
    const rebuiltSnapshots = buildCertificateSnapshots({
      organizationId: effectiveOrganizationId,
      organizationName: organization?.name || null,
      organizationLogoUrl: organization?.brand_logo_url || organization?.logo_url || null,
      organizationPrimaryColor: organization?.brand_color_primary || null,
      organizationAccentColor: organization?.brand_color_accent || null,
      organizationSecondaryColor: organization?.brand_color_secondary || null,
      templateId: template?.id || null,
      templateDesignConfig: template?.design_config || null,
      learnerName: getDisplayName(learner, 'Estudiante'),
      courseTitle: row.courses?.title || 'Curso sin título',
      instructorName: getDisplayName(instructor, 'Instructor'),
      instructorSignatureUrl: instructor?.signature_url || null,
      instructorSignatureName: instructor?.signature_name || null,
      issuedAt: row.issued_at,
    })

    brandingSnapshot = rebuiltSnapshots.brandingSnapshot
    documentSnapshot = rebuiltSnapshots.documentSnapshot
    updatePayload.branding_snapshot = toCertificateJson(rebuiltSnapshots.brandingSnapshot)
    updatePayload.document_snapshot = toCertificateJson(rebuiltSnapshots.documentSnapshot)
  }

  if (row.organization_id !== effectiveOrganizationId) {
    updatePayload.organization_id = effectiveOrganizationId
  }

  if ((row.template_id || null) !== (template?.id || null)) {
    updatePayload.template_id = template?.id || null
  }

  const certificateHash = await ensureCertificateHash(supabase, row)

  if (hasOwnKeys(updatePayload)) {
    const persistedUpdatePayload: CertificateUpdate = {}

    if (updatePayload.organization_id !== undefined) {
      persistedUpdatePayload.organization_id = updatePayload.organization_id
    }

    if (updatePayload.template_id !== undefined) {
      persistedUpdatePayload.template_id = updatePayload.template_id
    }

    if (dependencies.supportsSnapshots) {
      if (updatePayload.branding_snapshot !== undefined) {
        persistedUpdatePayload.branding_snapshot = updatePayload.branding_snapshot
      }

      if (updatePayload.document_snapshot !== undefined) {
        persistedUpdatePayload.document_snapshot = updatePayload.document_snapshot
      }
    }

    if (hasOwnKeys(persistedUpdatePayload)) {
      await supabase
        .from('user_course_certificates')
        .update(persistedUpdatePayload)
        .eq('certificate_id', row.certificate_id)
    }
  }

  if (!brandingSnapshot || !documentSnapshot) {
    throw new Error(`No se pudieron resolver snapshots para ${row.certificate_id}`)
  }

  const documentModel = buildCertificateDocumentModel({
    certificateId: row.certificate_id,
    certificateHash,
    certificateUrl: row.certificate_url,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    courseId: row.course_id,
    courseSlug: row.courses?.slug || null,
    enrollmentId: row.enrollment_id,
    brandingSnapshot,
    documentSnapshot,
  })

  return {
    certificateId: row.certificate_id,
    certificateHash,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    courseTitle: documentSnapshot.courseTitle,
    instructorName: documentSnapshot.instructorName,
    issuerName: brandingSnapshot.issuer.name,
    issuerLogoUrl: brandingSnapshot.issuer.logoUrl,
    certificateUrl: row.certificate_url,
    documentModel,
  }
}

async function resolveCertificates(
  supabase: SupabaseServerClient,
  result: QueryCertificatesResult,
): Promise<CertificateListItem[]> {
  const { rows, supportsSnapshots } = result

  if (rows.length === 0) {
    return []
  }

  const enrollmentOrganizations = await loadEnrollmentsMap(supabase, rows)
  const primaryOrganizations = await loadPrimaryOrganizationIdsMap(
    supabase,
    rows.map((row) => row.user_id),
  )
  const organizationIds = [...new Set(rows
    .map((row) =>
      resolveEffectiveOrganizationId({
        certificateOrganizationId: row.organization_id,
        enrollmentId: row.enrollment_id,
        enrollmentOrganizations,
        primaryOrganizations,
        userId: row.user_id,
      }),
    )
    .filter((value): value is string => Boolean(value)))]
  const organizations = await loadOrganizationsMap(supabase, organizationIds)
  const templates = await loadTemplates(supabase, rows, organizationIds)

  const userIds = [...new Set([
    ...rows.map((row) => row.user_id),
    ...rows.map((row) => row.courses?.instructor_id).filter((value): value is string => Boolean(value)),
  ])]
  const users = await loadUsersMap(supabase, userIds)

  return Promise.all(
    rows.map((row) =>
      resolveCertificateRecord(supabase, row, {
        supportsSnapshots,
        enrollmentOrganizations,
        organizations,
        primaryOrganizations,
        explicitTemplates: templates.explicitTemplates,
        defaultTemplates: templates.defaultTemplates,
        users,
      }),
    ),
  )
}

export class CertificateDataService {
  static async listUserCertificates(userId: string): Promise<CertificateListItem[]> {
    const supabase = createAdminClient()
    const result = await queryCertificates(supabase, { userId })
    return resolveCertificates(supabase, result)
  }

  static async getUserCertificateById(
    userId: string,
    certificateId: string,
  ): Promise<CertificateListItem | null> {
    const supabase = createAdminClient()
    const result = await queryCertificates(supabase, { userId, certificateId })
    const resolved = await resolveCertificates(supabase, result)
    return resolved[0] || null
  }

  static async getCertificateById(certificateId: string): Promise<CertificateListItem | null> {
    const supabase = createAdminClient()
    const result = await queryCertificates(supabase, { certificateId })
    const resolved = await resolveCertificates(supabase, result)
    return resolved[0] || null
  }

  static async getCertificateByHash(certificateHash: string): Promise<CertificateListItem | null> {
    const supabase = createAdminClient()
    const result = await queryCertificates(supabase, { certificateHash })
    const resolved = await resolveCertificates(supabase, result)
    return resolved[0] || null
  }
}
