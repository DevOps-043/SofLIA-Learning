import { createAdminClient } from '@/lib/supabase/admin'
import type { CertificateListItem } from '@/features/certificates/types/certificate'
import { queryCertificates } from './query-certificates.server'
import { resolveCertificates } from './resolve-certificates.server'

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
