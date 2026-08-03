import 'server-only'

import OpenAI from 'openai'

/**
 * Cliente de OpenAI compartido por proceso.
 *
 * MOTIVO DEL SINGLETON: el SDK mantiene un pool de conexiones HTTP keep-alive.
 * Instanciarlo por petición fuerza un handshake TLS nuevo en cada llamada, que en
 * rutas calientes añade cientos de milisegundos y agota puertos efímeros bajo
 * carga. El cliente no guarda estado por petición, así que compartirlo es seguro.
 *
 * SEGURIDAD: la clave se lee de `OPENAI_API_KEY` (solo servidor). Nunca debe
 * existir una variante `NEXT_PUBLIC_*`: quedaría incrustada en el bundle del
 * navegador y sería extraíble por cualquier usuario.
 */

let client: OpenAI | null = null
let clientApiKey: string | null = null

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

/**
 * Netlify AI Gateway inyecta silenciosamente `OPENAI_API_KEY` y
 * `OPENAI_BASE_URL` en Functions de planes basados en creditos. Detectarlo evita
 * confundir esa credencial de Netlify con una clave propia de OpenAI.
 */
export function isNetlifyAiGatewayActiveForOpenAi(): boolean {
  const openAiBaseUrl = process.env.OPENAI_BASE_URL?.trim()
  const netlifyGatewayBaseUrl = process.env.NETLIFY_AI_GATEWAY_BASE_URL?.trim()
  if (!openAiBaseUrl) return false

  return Boolean(
    (netlifyGatewayBaseUrl && openAiBaseUrl.startsWith(netlifyGatewayBaseUrl))
    || /netlify/i.test(openAiBaseUrl),
  )
}

export function getOpenAiCredentialIssue(): string | null {
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim())
  const gatewayActive = hasApiKey && isNetlifyAiGatewayActiveForOpenAi()

  if (gatewayActive && !isEnabled(process.env.OPENAI_ALLOW_NETLIFY_AI_GATEWAY)) {
    return process.env.OPENAI_APY_KEY?.trim()
      ? 'AI_CREDENTIAL_SOURCE_BLOCKED:NETLIFY_AI_GATEWAY;AI_API_KEY_MISNAMED:OPENAI_APY_KEY->OPENAI_API_KEY'
      : 'AI_CREDENTIAL_SOURCE_BLOCKED:NETLIFY_AI_GATEWAY'
  }

  if (hasApiKey) return null

  if (process.env.OPENAI_APY_KEY?.trim()) {
    return 'AI_API_KEY_MISNAMED:OPENAI_APY_KEY->OPENAI_API_KEY'
  }

  return 'AI_API_KEY_MISSING:openai'
}

export function getOpenAiApiKey(): string | null {
  return getOpenAiCredentialIssue() === null
    ? process.env.OPENAI_API_KEY?.trim() || null
    : null
}

/**
 * Organización y proyecto son opcionales. Fijarlos importa cuando la cuenta
 * tiene varios proyectos: sin ellos el consumo se imputa al proyecto por defecto
 * y los límites de gasto por proyecto no aplican.
 */
export function getOpenAiClient(): OpenAI {
  const apiKey = getOpenAiApiKey()
  if (!apiKey) {
    throw new Error(getOpenAiCredentialIssue() ?? 'OPENAI_API_KEY no esta configurada')
  }

  // Si la clave cambia en caliente (rotación en el entorno) se reconstruye el
  // cliente en lugar de seguir usando la anterior.
  if (client && clientApiKey === apiKey) {
    return client
  }

  client = new OpenAI({
    apiKey,
    // Los reintentos los gobierna el circuit breaker de la plataforma, que ya
    // cuenta fallos y abre el circuito. Dejar que el SDK reintente por su cuenta
    // multiplicaría la carga sobre un proveedor ya degradado y falsearía la
    // latencia observada.
    maxRetries: 0,
    ...(process.env.OPENAI_ORGANIZATION?.trim()
      ? { organization: process.env.OPENAI_ORGANIZATION.trim() }
      : {}),
    ...(process.env.OPENAI_PROJECT?.trim()
      ? { project: process.env.OPENAI_PROJECT.trim() }
      : {}),
  })
  clientApiKey = apiKey

  return client
}

/** Reinicio explícito para pruebas: evita que el cliente sobreviva entre casos. */
export function resetOpenAiClientForTests(): void {
  client = null
  clientApiKey = null
}
