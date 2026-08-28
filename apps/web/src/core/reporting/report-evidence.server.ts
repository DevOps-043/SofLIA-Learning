import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

import { REPORT_PROBLEM_STORAGE_BUCKET } from './report-problem.server'

const SIGNED_EVIDENCE_TTL_SECONDS = 5 * 60
const SAFE_STORAGE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,511}$/

export async function createSignedReportEvidenceUrl(
  reference: string | null | undefined,
): Promise<string | null> {
  const storagePath = resolveReportEvidenceStoragePath(reference)
  if (!storagePath) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(REPORT_PROBLEM_STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_EVIDENCE_TTL_SECONDS)

  return error ? null : data?.signedUrl ?? null
}

export function resolveReportEvidenceStoragePath(
  reference: string | null | undefined,
): string | null {
  const trimmed = reference?.trim()
  if (!trimmed) return null

  if (!/^https?:\/\//i.test(trimmed)) {
    return isSafeStoragePath(trimmed) ? trimmed : null
  }

  try {
    const url = new URL(trimmed)
    const configuredOrigin = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
    ).origin
    if (url.origin !== configuredOrigin) return null

    const markers = [
      `/storage/v1/object/public/${REPORT_PROBLEM_STORAGE_BUCKET}/`,
      `/storage/v1/object/sign/${REPORT_PROBLEM_STORAGE_BUCKET}/`,
    ]
    const marker = markers.find((candidate) => url.pathname.startsWith(candidate))
    if (!marker) return null

    const storagePath = decodeURIComponent(url.pathname.slice(marker.length))
    return isSafeStoragePath(storagePath) ? storagePath : null
  } catch {
    return null
  }
}

function isSafeStoragePath(value: string) {
  return SAFE_STORAGE_PATH.test(value)
    && !value.split('/').some((segment) => segment === '.' || segment === '..')
}
