import type { CertificateRow } from './types'

export function buildCertificatesMap(certificates: CertificateRow[]) {
  const certificatesMap = new Map<string, boolean>()
  certificates.forEach((certificate) => {
    certificatesMap.set(certificate.course_id, true)
  })
  return certificatesMap
}
