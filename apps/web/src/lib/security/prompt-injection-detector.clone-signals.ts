export const CLONE_INTENT_KEYWORDS = [
  'clona', 'cloname', 'clonar', 'clone', 'mirror', 'replica', 'replicar',
  'recrea', 'recrear', 'reconstruye', 'reconstruir', 'reimplementa',
  'reimplementacion', 'copia', 'copiar', 'extrae', 'extraer', 'mapea',
  'mapear', 'deriva', 'derivar', 'reverse engineer', 'ingenieria inversa',
]

export const CLONE_ASSET_KEYWORDS = [
  'html', 'css', 'dom', 'codigo fuente', 'source code', 'codigo',
  'componentes', 'component tree', 'react', 'next', 'layout', 'estructura',
  'arquitectura', 'modulos', 'rutas', 'frontend', 'pixel perfect',
  'equivalente', 'equivalentes', 'similar', 'similares',
]

export const CLONE_TARGET_KEYWORDS = [
  'pagina', 'sitio', 'website', 'site', 'landing', 'app', 'aplicacion',
  'frontend',
]

export const STRONG_CLONE_BLUEPRINT_PATTERNS = [
  /\bhtml base\b/i,
  /\bcss minimo\b/i,
  /\bcomponentes react principales\b/i,
  /\bestructura dom sugerida\b/i,
  /\bestructura aproximada\b/i,
  /\bseguir este patron\b/i,
  /\bsecciones restantes\b/i,
]

export const DISALLOWED_CLONE_ASSISTANCE_PATTERNS = [
  /\bhtml\b/i,
  /\bcss\b/i,
  /\bdom\b/i,
  /\bcomponentes?\b.{0,20}\b(react|next|equivalentes|equivalente|similares|similar)\b/i,
  /\barbol\b.{0,20}\b(de componentes|del dom|dom|componentes)\b/i,
  /\bestructura\b.{0,30}\b(funcional|equivalente|equivalentes|similar|similares|semantica)\b/i,
  /\blayout\b.{0,20}\b(similar|equivalente|base)\b/i,
  /\brutas?\b.{0,20}\b(principales|equivalentes|similares)\b/i,
  /\bmodulos?\b.{0,20}\b(de dominio|domain|frontend|arquitectura)\b/i,
  /\b(hero|navbar|footer|features|capabilities|usecases|contact)\b/i,
  /\breconstruir\b/i,
  /\breplicar\b/i,
  /\bmapear\b/i,
  /\bderivar\b.{0,25}\b(arquitectura|componentes|modulos|rutas|dom)\b/i,
  /<!doctype html>/i,
  /<html\b/i,
  /<body\b/i,
  /\bimport\s+react\b/i,
  /\bexport\s+default\b/i,
  /\bfunction\s+(app|hero|header|footer|enterpriseready|platform|capabilities|usecases|impact|assistant|security|faq|cta)\b/i,
  /\bclassName\s*=/i,
  /\b:root\s*\{/i,
  /--(?:bg|fg|accent|shadow|radius|card|border)\b/i,
]
