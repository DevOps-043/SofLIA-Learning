export interface SupabaseRuntimeConfig {
  url: string
  anonKey: string
}

export function getSupabaseRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env
): SupabaseRuntimeConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      [
        'Missing Supabase environment variables.',
        `NEXT_PUBLIC_SUPABASE_URL: ${url ? 'present' : 'missing'}`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? 'present' : 'missing'}`,
      ].join(' ')
    )
  }

  return { url, anonKey }
}
