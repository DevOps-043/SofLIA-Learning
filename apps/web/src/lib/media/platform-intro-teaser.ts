/**
 * Teaser institucional de SofLIA que se reproduce antes del tour de
 * onboarding, tanto en el panel de negocio como en el dashboard del usuario.
 * Vive en el bucket publico `assets`.
 *
 * Se centraliza aqui para tener una unica fuente de verdad: la API
 * (`/api/media/intro-teaser`) usa esta misma URL como `source_url` al
 * resolver la variante HLS, y el fallback del cliente la reutiliza. Si las
 * dos cadenas no fueran identicas, la resolucion a HLS nunca encontraria el
 * job de transcodificacion correspondiente en `video_transcoding_jobs`.
 */
const PLATFORM_INTRO_TEASER_STORAGE_PATH =
  'storage/v1/object/public/assets/Teaser%20-%20SofLIA%20Nexus.mp4'

/**
 * Construye la URL del MP4 original del teaser institucional.
 *
 * Devuelve null cuando no hay URL de Supabase configurada (p. ej. en build
 * sin env), para que el llamador decida el comportamiento degradado en
 * lugar de generar una URL invalida.
 */
export function buildPlatformIntroTeaserSourceUrl(
  supabaseUrl: string | undefined | null,
): string | null {
  if (!supabaseUrl) return null
  return `${supabaseUrl.replace(/\/+$/, '')}/${PLATFORM_INTRO_TEASER_STORAGE_PATH}`
}
