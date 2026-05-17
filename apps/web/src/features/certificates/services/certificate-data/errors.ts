import type { CertificateUpdate, SupabaseErrorLike } from './types'

export function hasOwnKeys(value: CertificateUpdate): boolean {
  return Object.keys(value).length > 0
}

export function isMissingSnapshotColumnsError(error: unknown): error is SupabaseErrorLike {
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
