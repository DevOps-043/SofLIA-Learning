import 'server-only'

import { fileTypeFromBuffer } from 'file-type'

import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'intro-videos'
const SIGNATURE_BYTES = 8192
const OBJECT_MARKER = `/storage/v1/object/public/${BUCKET}/`
const UUID_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(mp4|webm)$/i

export type IntroVideoFolder = 'courses' | 'lp'

export async function validateOwnedIntroVideoUpload(input: {
  folder: IntroVideoFolder
  organizationSlug: string
  publicUrl: string
}): Promise<{ storagePath: string } | null> {
  const resolved = resolveOwnedIntroVideoReference(input)
  if (!resolved) return null

  const response = await fetchWithCircuitBreaker(
    'supabase-intro-video-signature',
    resolved.url,
    {
      cache: 'no-store',
      headers: { Range: `bytes=0-${SIGNATURE_BYTES - 1}` },
      redirect: 'error',
    },
    { maxRetries: 0, timeoutMs: 10_000 },
  )

  if (response.status !== 206) {
    await response.body?.cancel().catch(() => undefined)
    return null
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength === 0 || bytes.byteLength > SIGNATURE_BYTES) return null

  const detected = await fileTypeFromBuffer(bytes)
  const extension = resolved.storagePath.split('.').pop()?.toLowerCase()
  const valid = detected
    && ((detected.mime === 'video/mp4' && extension === 'mp4')
      || (detected.mime === 'video/webm' && extension === 'webm'))

  return valid ? { storagePath: resolved.storagePath } : null
}

export async function removeInvalidIntroVideo(storagePath: string | null) {
  if (!storagePath) return
  await createAdminClient().storage.from(BUCKET).remove([storagePath])
}

export function resolveOwnedIntroVideoReference(input: {
  folder: IntroVideoFolder
  organizationSlug: string
  publicUrl: string
}): { storagePath: string; url: URL } | null {
  try {
    const configuredUrl = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
    )
    const url = new URL(input.publicUrl)
    if (url.origin !== configuredUrl.origin || url.username || url.password) return null
    if (url.search || url.hash || !url.pathname.startsWith(OBJECT_MARKER)) return null

    const storagePath = decodeURIComponent(url.pathname.slice(OBJECT_MARKER.length))
    const slug = input.organizationSlug.trim().toLowerCase()
    const prefix = `org/${slug}/${input.folder}/`
    if (!storagePath.startsWith(prefix)) return null

    const fileName = storagePath.slice(prefix.length)
    if (!UUID_FILE.test(fileName) || fileName.includes('/')) return null

    return { storagePath, url }
  } catch {
    return null
  }
}
