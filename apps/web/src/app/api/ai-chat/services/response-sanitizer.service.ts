const SYSTEM_PROMPT_LEAK_MARKERS = [
  'CONTEXTO DE LA PÁGINA ACTUAL',
  'FORMATO DE RESPUESTAS',
  'RESTRICCIONES DE CONTENIDO',
  'INSTRUCCIONES PARA PROPORCIONAR URLs',
  'IDENTIDAD Y PROPÓSITO',
  'Eres SofLIA',
]

const SAFE_FALLBACK_RESPONSE =
  'Lo siento, tuve un problema al procesar la respuesta. Reformula tu pregunta sobre la plataforma, el curso o la herramienta que estás usando.'

type RuntimeEnv = NodeJS.ProcessEnv

function countLeakMarkers(content: string): number {
  return SYSTEM_PROMPT_LEAK_MARKERS.reduce((count, marker) => {
    return content.includes(marker) ? count + 1 : count
  }, 0)
}

export function filterSystemPromptFromResponse(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) {
    return ''
  }

  const leakMarkerCount = countLeakMarkers(trimmed)
  const startsLikeSystemPrompt =
    trimmed.startsWith('Eres SofLIA') ||
    trimmed.startsWith('IDENTIDAD Y PROPÓSITO:') ||
    trimmed.startsWith('RESTRICCIONES DE CONTENIDO')

  if (startsLikeSystemPrompt || leakMarkerCount >= 2) {
    return SAFE_FALLBACK_RESPONSE
  }

  return trimmed
}

export function cleanMarkdownFromResponse(content: string): string {
  return content
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1$2')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\s>\s/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim()
}

export function normalizePlatformLinks(
  content: string,
  env: RuntimeEnv = process.env
): string {
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  const baseUrl = allowedOrigins[0] || env.PUBLIC_APP_URL || 'https://aprendeyaplica.ai'
  const pathMap: Record<string, string> = {}

  return content
    .replace(/\[([^\]]+)\]\((\/[^\)]+)\)/g, (_match: string, label: string, path: string) => {
      const normalizedPath = pathMap[path] || path
      return `[${label}](${baseUrl}${normalizedPath})`
    })
    .replace(/https?:\/\/tusitio\.com\/dashboard/gi, `${baseUrl}/dashboard`)
    .replace(/https?:\/\/tusitio\.com(\/[^\s\)]*)?/gi, (_match: string, path?: string) => {
      const normalizedPath = pathMap[path || ''] || path || ''
      return `${baseUrl}${normalizedPath}`
    })
    .replace(/\(\/dashboard\)/g, `(${baseUrl}/dashboard)`)
}

export function sanitizeAssistantResponse(
  content: string,
  env: RuntimeEnv = process.env
): string {
  const filtered = filterSystemPromptFromResponse(content)
  const cleaned = cleanMarkdownFromResponse(filtered)
  return normalizePlatformLinks(cleaned, env)
}
