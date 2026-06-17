/**
 * Visible Screen Content Service
 *
 * Captura lo que el usuario está viendo AHORA MISMO para que SofLIA pueda
 * explicarlo (p. ej. el panel "Mis estadísticas" / "Estadísticas de <usuario>").
 *
 * Por qué existe: el LiaSidePanel (que usan los paneles de admin/business) solo
 * enviaba el `pathname` al endpoint de chat. Como los paneles de estadísticas se
 * abren en un **modal** (portal en `<body>`, fuera de `<main>`), SofLIA no tenía
 * forma de "ver" sus métricas y respondía de forma genérica. Este extractor:
 *   1. Prioriza un diálogo/modal abierto y visible (`[role="dialog"]`), que es lo
 *      que el usuario tiene en primer plano.
 *   2. Si no hay modal, cae al contenido principal de la página (`main`/`body`).
 *
 * Es defensivo: nunca lanza y en SSR devuelve vacío.
 */

const MAX_VISIBLE_TEXT_LENGTH = 3500
const MAX_HEADINGS = 8
// Excluye ruido y, sobre todo, el propio panel de SofLIA para no realimentar su
// interfaz como si fuera contenido de la página.
const UNWANTED_SELECTORS = [
  'script',
  'style',
  'svg',
  'noscript',
  'nav',
  'header',
  'footer',
  '.lia-side-panel-shell',
  '[data-tour-id="soflia-side-panel"]',
]
const MAIN_SELECTORS = ['main', '[role="main"]', '#main-content', '.main-content', 'article']

export interface VisibleScreenContent {
  title: string
  headings: string[]
  text: string
  source: 'dialog' | 'main' | 'body' | 'none'
}

const EMPTY_CONTENT: VisibleScreenContent = { title: '', headings: [], text: '', source: 'none' }

function isElementVisible(element: Element): boolean {
  const htmlElement = element as HTMLElement
  if (htmlElement.offsetParent === null && htmlElement.getClientRects().length === 0) {
    return false
  }
  const style = window.getComputedStyle(htmlElement)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

/** Devuelve el modal/diálogo abierto más relevante (el último visible = el de encima). */
function findOpenDialog(): Element | null {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]'))
    .filter(isElementVisible)
  return dialogs.length > 0 ? dialogs[dialogs.length - 1] : null
}

function pickContentRoot(): { root: Element | null; source: VisibleScreenContent['source'] } {
  const dialog = findOpenDialog()
  if (dialog) {
    return { root: dialog, source: 'dialog' }
  }
  for (const selector of MAIN_SELECTORS) {
    const element = document.querySelector(selector)
    if (element) {
      return { root: element, source: 'main' }
    }
  }
  return { root: document.body || null, source: document.body ? 'body' : 'none' }
}

function collectHeadings(root: Element): string[] {
  const headings: string[] = []
  root.querySelectorAll('h1, h2, h3').forEach((heading) => {
    const text = heading.textContent?.replace(/\s+/g, ' ').trim()
    if (text && headings.length < MAX_HEADINGS && !headings.includes(text)) {
      headings.push(text)
    }
  })
  return headings
}

function extractText(root: Element): string {
  const clone = root.cloneNode(true) as Element
  UNWANTED_SELECTORS.forEach((selector) =>
    clone.querySelectorAll(selector).forEach((node) => node.remove()),
  )
  const text = (clone.textContent || '').replace(/\s+/g, ' ').trim()
  return text.length > MAX_VISIBLE_TEXT_LENGTH
    ? `${text.slice(0, MAX_VISIBLE_TEXT_LENGTH)}…`
    : text
}

function resolveTitle(root: Element, source: VisibleScreenContent['source']): string {
  if (source === 'dialog') {
    const heading = root.querySelector('h1, h2, [role="heading"]')?.textContent?.replace(/\s+/g, ' ').trim()
    if (heading) return heading
  }
  return document.title || ''
}

export function extractVisibleScreenContent(): VisibleScreenContent {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return EMPTY_CONTENT
  }

  try {
    const { root, source } = pickContentRoot()
    if (!root) return EMPTY_CONTENT

    return {
      title: resolveTitle(root, source),
      headings: collectHeadings(root),
      text: extractText(root),
      source,
    }
  } catch {
    return EMPTY_CONTENT
  }
}
