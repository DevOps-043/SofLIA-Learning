import type { NanobananaDomain } from './types'

export const NANOBANA_PATTERNS = [
  /\bnanobana(na)?\b/i,
  /\bnano\s*banana\b/i,
  /\b(json|esquema)\b.*\b(imagen|diseño|ui|interfaz)\b/i,
  /\b(imagen|diseño|ui|interfaz)\b.*\b(json|esquema)\b/i,
  /\b(wireframe|mockup|prototipo|boceto)\b.*\b(generar|crear|diseñar|haz)\b/i,
  /\b(generar|crear|diseñar|haz)\b.*\b(wireframe|mockup|prototipo|boceto)\b/i,
  /\b(diseñar?|crear|generar|haz(me)?)\b.*\b(app|aplicación|interfaz|ui|ux|pantalla)\b/i,
  /\b(app|aplicación|interfaz|ui|ux|pantalla)\b.*\b(diseñar?|crear|generar|haz)\b/i,
  /\b(diagrama|flowchart|arquitectura|flujo|esquema)\b.*\b(generar|crear|diseñar|haz)\b/i,
  /\b(generar|crear|diseñar|haz)\b.*\b(diagrama|flowchart|arquitectura|flujo)\b/i,
  /\b(foto|fotografía|imagen)\b.*\b(producto|marketing|comercial|publicit)\b/i,
  /\b(producto|marketing|comercial|publicit)\b.*\b(foto|fotografía|imagen)\b/i,
  /\b(render|renderizar)\b.*\b(preciso|exacto|profesional)\b/i,
  /\b(crear?|genera[r]?|diseña[r]?|haz(me)?|necesito|quiero|dame)\b.*\b(una?\s*)?(imagen|visual|visualización)\b/i,
  /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(una?\s*)?(landing|página\s*web|dashboard|panel)\b/i,
  /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(una?\s*)?(logo|banner|poster|cartel|anuncio)\b/i,
  /\b(diseña(r|me)?|dibuja(r|me)?|crea(r|me)?)\b.*\b(una?\s*)?(app|aplicación|móvil|mobile)\b/i,
  /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup|prototipo)\b/i,
  /^diseña(me)?\s+/i,
  /^crea(me)?\s+(una?\s*)?(imagen|diseño|app|interfaz|wireframe|mockup|diagrama)/i,
  /^genera(me)?\s+(una?\s*)?(imagen|diseño|visual)/i,
  /^haz(me)?\s+(una?\s*)?(imagen|diseño|app|interfaz|wireframe|mockup)/i,
]

export const NANOBANA_DOMAIN_KEYWORDS: Record<NanobananaDomain, string[]> = {
  ui: [
    'app', 'aplicación', 'interfaz', 'ui', 'ux', 'wireframe', 'mockup',
    'pantalla', 'screen', 'dashboard', 'landing', 'mobile', 'web',
    'componente', 'botón', 'formulario', 'navbar', 'sidebar',
  ],
  photo: [
    'foto', 'fotografía', 'imagen', 'producto', 'marketing', 'banner',
    'publicidad', 'anuncio', 'estudio', 'iluminación', 'composición',
    'render', 'escena',
  ],
  diagram: [
    'diagrama', 'flujo', 'flowchart', 'arquitectura', 'esquema',
    'proceso', 'secuencia', 'uml', 'erd', 'organigrama', 'mapa',
  ],
}
