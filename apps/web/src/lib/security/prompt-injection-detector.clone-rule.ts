import type { DetectionRule } from './prompt-injection-detector.types'

export const CLONING_RULE: DetectionRule = {
  category: 'cloning',
  weight: 45,
  reason: 'Attempt to clone, mirror, reverse engineer, or reconstruct the application.',
  patterns: [
    /\bclone\b.{0,20}\b(page|site|app|website|web|landing|frontend)\b/i,
    /\bclona(?:me|r)?\b.{0,30}\b(pagina|sitio|web|app|landing|frontend)\b/i,
    /\bmirror\b.{0,20}\b(page|site|app|website)\b/i,
    /\breconstruct\b.{0,30}\b(dom|html|css|page|site|app)\b/i,
    /\brecreate\b.{0,30}\b(dom|html|css|page|site|app)\b/i,
    /\breplica(?:r)?\b.{0,30}\b(pagina|sitio|dom|html|css|app)\b/i,
    /\breconstru(?:ye|ir)\b.{0,30}\b(dom|html|css|pagina|sitio|app)\b/i,
    /\bcopiar\b.{0,30}\b(codigo fuente|source code|dom|html|css|pagina|sitio)\b/i,
    /\bextrae\b.{0,30}\b(dom|html|css|codigo fuente|source)\b/i,
    /\bmapea(?:r)?\b.{0,30}\b(toda la app|la app|aplicacion|sitio|pagina)\b/i,
    /\b(estructura|layout|css|html|dom)\b.{0,30}\b(equivalente|equivalentes|similar|similares|parecido|replicable)\b/i,
    /\barbol\b.{0,20}\b(de componentes|del dom|dom|componentes)\b/i,
    /\bcomponentes?\b.{0,30}\b(react|next|equivalentes|equivalente|similares|similar)\b/i,
    /\bentrega(?:me)?\b.{0,30}\b(html|css|dom|codigo|componentes?)\b/i,
    /\bdame\b.{0,30}\b(html|css|dom|codigo|componentes?)\b/i,
    /\bpixel perfect\b/i,
    /\breverse engineer(?:ing)?\b/i,
    /\bingenieria inversa\b/i,
    /\bderiva(?:r)?\b.{0,25}\b(arquitectura|dom|html|css|componentes|modulos|rutas)\b/i,
  ],
}

export const OFF_SCOPE_AUTOMATION_RULE: DetectionRule = {
  category: 'off_scope_automation',
  weight: 20,
  reason: 'Attempt to force unrelated automation outside SofLIA workflows.',
  patterns: [
    /\bvisit\b.{0,40}\b(another|external|unrelated)\b.{0,40}\b(site|website|page)\b/i,
    /\babre\b.{0,40}\b(otra|externa|ajena)\b.{0,40}\b(pagina|web|sitio)\b/i,
    /\boperate outside\b.{0,40}\b(soflia|the platform)\b/i,
    /\bfuera del sistema\b/i,
  ],
}
