import type { GenerateNanoBananaBody, NanoBananaDomain, OutputFormat } from './types'

const VALID_DOMAINS: NanoBananaDomain[] = ['ui', 'photo', 'diagram']
const VALID_FORMATS: OutputFormat[] = ['wireframe', 'mockup', 'render', 'diagram']
const UI_PATTERNS = ['app', 'aplicacion', 'interfaz', 'ui', 'ux', 'wireframe', 'mockup', 'pantalla', 'dashboard', 'navbar', 'menu', 'sidebar', 'modal', 'card', 'movil', 'mobile', 'web', 'responsive', 'componente', 'landing']
const PHOTO_PATTERNS = ['foto', 'photo', 'imagen', 'image', 'producto', 'product', 'marketing', 'publicidad', 'anuncio', 'banner', 'poster', 'retrato', 'portrait', 'escena', 'scene', 'estudio', 'studio', 'iluminacion', 'lighting', 'composicion', 'portada', 'cover', 'promocional', 'educativo', 'curso', 'course', 'ilustracion', 'illustration']
const DIAGRAM_PATTERNS = ['diagrama', 'diagram', 'flujo', 'flow', 'proceso', 'process', 'arquitectura', 'architecture', 'esquema', 'schema', 'mapa', 'organigrama', 'flowchart', 'secuencia', 'sequence', 'erd', 'uml', 'red', 'network', 'relacion', 'conexion']

export function resolveNanoBananaPreferences(body: GenerateNanoBananaBody) {
  const domain = isValidDomain(body.preferredDomain) ? body.preferredDomain : detectDomain(body.message || '')
  const outputFormat = isValidFormat(body.preferredFormat)
    ? body.preferredFormat
    : detectOutputFormat(body.message || '', domain)
  return { domain, outputFormat }
}

export function detectDomain(message: string): NanoBananaDomain {
  const messageLower = normalizeComparableText(message)
  const uiScore = countPatternMatches(messageLower, UI_PATTERNS)
  const photoScore = countPatternMatches(messageLower, PHOTO_PATTERNS)
  const diagramScore = countPatternMatches(messageLower, DIAGRAM_PATTERNS)
  if (diagramScore > uiScore && diagramScore > photoScore) return 'diagram'
  if (photoScore > uiScore && photoScore > diagramScore) return 'photo'
  return 'ui'
}

export function detectOutputFormat(message: string, domain: NanoBananaDomain): OutputFormat {
  const messageLower = normalizeComparableText(message)
  if (messageLower.includes('wireframe') || messageLower.includes('esquema') || messageLower.includes('boceto')) return 'wireframe'
  if (messageLower.includes('mockup') || messageLower.includes('prototipo') || messageLower.includes('alta fidelidad')) return 'mockup'
  if (messageLower.includes('render') || messageLower.includes('final') || messageLower.includes('produccion')) return 'render'
  return domain === 'photo' ? 'render' : domain === 'diagram' ? 'diagram' : 'wireframe'
}

function isValidDomain(value: unknown): value is NanoBananaDomain {
  return typeof value === 'string' && VALID_DOMAINS.includes(value as NanoBananaDomain)
}

function isValidFormat(value: unknown): value is OutputFormat {
  return typeof value === 'string' && VALID_FORMATS.includes(value as OutputFormat)
}

function countPatternMatches(message: string, patterns: string[]) {
  return patterns.filter((pattern) => message.includes(pattern)).length
}

function normalizeComparableText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
