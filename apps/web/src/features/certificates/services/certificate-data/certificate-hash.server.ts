import type { CertificateRow, SupabaseServerClient } from './types'

export async function ensureCertificateHash(
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
