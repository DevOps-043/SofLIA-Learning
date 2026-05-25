export const NAVIGATE_PATTERNS = [
  /\b(ir|llevar|mostrar|ver|navegar)\b.*(a|hacia|al)\b/i,
  /\bdónde\b.*(está|encuentro|veo)\b/i,
  /\bcómo\b.*(accedo|llego)\b/i,
  /\b(página|sección)\b.*(de|para)\b/i,
  /\b(quiero|necesito)\b.*(ir|ver|acceder)\b/i,
  /\b(ll[eé]vame|llevame|llévame)\b/i,
  /\b(mu[eé]strame|muestrame|muéstrame)\b/i,
  /\b(dame|dime).*(link|enlace|url)\b/i,
  /\b(abre|abrir)\b/i,
  /\b(acceder|acceso)\b.*\b(a|al)\b/i,
  /\b(link|enlace)\b.*\b(de|del|a|al|para)\b/i,
]

export const NAVIGATION_KEYWORDS = [
  'noticias', 'noticia', 'news', 'comunidades', 'comunidad', 'communities',
  'dashboard', 'panel', 'inicio', 'perfil', 'profile', 'cuenta',
  'cursos', 'curso', 'courses', 'talleres', 'taller', 'workshops',
  'directorio', 'prompts', 'apps', 'configuración', 'ajustes', 'settings',
]

export const SITE_PAGES: Record<string, string[]> = {
  courses: ['cursos', 'curso', 'formación', 'aprendizaje'],
  workshops: ['talleres', 'taller', 'workshop', 'eventos'],
  communities: ['comunidades', 'comunidad', 'grupos', 'networking'],
  news: ['noticias', 'artículos', 'actualizaciones'],
  dashboard: ['panel', 'inicio', 'escritorio'],
  profile: ['perfil', 'cuenta', 'configuración'],
}
