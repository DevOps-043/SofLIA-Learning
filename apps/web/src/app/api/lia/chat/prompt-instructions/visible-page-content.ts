import type { PlatformContext } from './types'

const MAX_HEADINGS = 8
const MAX_VISIBLE_TEXT = 3500

/**
 * Sección de PRIORIDAD ALTA con el contenido que el usuario está viendo AHORA
 * MISMO (título, encabezados y texto visible), capturado por el cliente desde el
 * DOM —incluyendo modales/paneles como "Mis estadísticas" / "Estadísticas de
 * <usuario>"—. Resuelve que SofLIA respondiera de forma genérica cuando el panel
 * de estadísticas se abre en un modal (el `pathname` no cambia, así que la
 * metadata de la ruta no describe lo que el usuario realmente ve).
 *
 * Defensivo: si no hay contenido visible capturado, devuelve cadena vacía.
 */
export function buildVisiblePageContentSection(context: PlatformContext): string {
  const title = typeof context.pageTitle === 'string' ? context.pageTitle.trim() : ''
  const headings = Array.isArray(context.pageHeadings)
    ? context.pageHeadings.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : []
  const visibleText = typeof context.pageVisibleText === 'string' ? context.pageVisibleText.trim() : ''

  if (!title && headings.length === 0 && !visibleText) {
    return ''
  }

  const isDialog = context.pageContentSource === 'dialog'
  const lines: string[] = []

  lines.push('\n\n========================================')
  lines.push('CONTENIDO VISIBLE EN PANTALLA (PRIORIDAD ALTA)')
  lines.push('========================================')
  lines.push(
    isDialog
      ? 'El usuario tiene abierto un panel/modal en primer plano. Estos son los datos REALES que está viendo en este momento:'
      : 'Esto es lo que el usuario está viendo en la página en este momento:',
  )

  if (title) {
    lines.push(`- Título: "${title}"`)
  }
  if (headings.length > 0) {
    lines.push(`- Secciones visibles: ${headings.slice(0, MAX_HEADINGS).join(' · ')}`)
  }
  if (visibleText) {
    lines.push(`- Contenido visible (texto extraído de la pantalla):\n"""\n${visibleText.slice(0, MAX_VISIBLE_TEXT)}\n"""`)
  }

  lines.push('')
  lines.push(
    'INSTRUCCIÓN: Si el usuario pregunta por las estadísticas, métricas o datos que ' +
      'aparecen en pantalla, EXPLÍCALOS usando exactamente los valores y etiquetas de ' +
      'arriba (por ejemplo: progreso promedio, adopción de SofLIA, calidad global, ' +
      'lecciones completadas, tiempo de estudio, certificados, avance por curso). ' +
      'No respondas de forma genérica ni lo remitas a otra sección si el dato ya está ' +
      'visible aquí. Interpreta qué significa cada métrica y qué indica el valor mostrado. ' +
      'Si un valor está en 0, acláralo (por ejemplo, "0 conversaciones" significa que ' +
      'aún no hay uso registrado de SofLIA en el periodo seleccionado).',
  )

  return lines.join('\n')
}
