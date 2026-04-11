export interface SupabaseRuntimeConfig {
  url: string
  anonKey: string
}

/**
 * Overrides opcionales para testing.
 *
 * Next.js reemplaza `process.env.NEXT_PUBLIC_*` de forma estática en build-time.
 * Si se pasa `process.env` como un objeto genérico (p.ej. como parámetro),
 * webpack NO puede hacer la sustitución y los valores quedan undefined en el
 * navegador.
 *
 * Por eso se accede siempre a `process.env.NEXT_PUBLIC_*` de forma literal
 * dentro de la función, y solo se aceptan overrides explícitos para tests.
 */
export interface SupabaseConfigOverrides {
  url?: string
  anonKey?: string
}

/**
 * Devuelve la configuración de runtime de Supabase.
 *
 * En producción se leen las variables de entorno directamente.
 * En tests se pueden inyectar overrides explícitos sin romper la sustitución
 * estática que Next.js hace de `process.env.NEXT_PUBLIC_*`.
 */
export function getSupabaseRuntimeConfig(
  overrides?: SupabaseConfigOverrides
): SupabaseRuntimeConfig {
  const url = overrides?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    overrides?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
