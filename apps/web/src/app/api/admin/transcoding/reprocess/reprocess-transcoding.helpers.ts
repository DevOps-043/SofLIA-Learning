import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createTranscodingSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export function getPublicSourceUrl(
  supabase: SupabaseClient,
  bucket: string,
  sourcePath: string,
) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(sourcePath)
  return data?.publicUrl ?? null
}

export async function readSourceSizeBytes(
  supabase: SupabaseClient,
  bucket: string,
  sourcePath: string,
) {
  try {
    const folderPath = sourcePath.replace(/\/[^/]+$/, '')
    const fileName = sourcePath.split('/').pop()

    if (!folderPath || !fileName) {
      return undefined
    }

    const { data: list } = await supabase.storage
      .from(bucket)
      .list(folderPath, { search: fileName, limit: 1 })
    const found = list?.find((entry) => entry.name === fileName)
    const meta = (found?.metadata ?? null) as { size?: number } | null

    return typeof meta?.size === 'number' ? meta.size : undefined
  } catch {
    return undefined
  }
}
