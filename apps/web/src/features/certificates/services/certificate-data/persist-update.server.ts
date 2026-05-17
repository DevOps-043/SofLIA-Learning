import { hasOwnKeys } from './errors'
import type { CertificateUpdate, SupabaseServerClient } from './types'

export async function persistCertificateUpdate(
  supabase: SupabaseServerClient,
  certificateId: string,
  supportsSnapshots: boolean,
  updatePayload: CertificateUpdate,
) {
  const persistedUpdatePayload: CertificateUpdate = {}

  if (updatePayload.organization_id !== undefined) {
    persistedUpdatePayload.organization_id = updatePayload.organization_id
  }

  if (updatePayload.template_id !== undefined) {
    persistedUpdatePayload.template_id = updatePayload.template_id
  }

  if (supportsSnapshots && updatePayload.branding_snapshot !== undefined) {
    persistedUpdatePayload.branding_snapshot = updatePayload.branding_snapshot
  }

  if (supportsSnapshots && updatePayload.document_snapshot !== undefined) {
    persistedUpdatePayload.document_snapshot = updatePayload.document_snapshot
  }

  if (!hasOwnKeys(persistedUpdatePayload)) {
    return
  }

  await supabase
    .from('user_course_certificates')
    .update(persistedUpdatePayload)
    .eq('certificate_id', certificateId)
}
