/**
 * Page Capabilities Service
 *
 * Construye una seccion de prompt ENFOCADA en la pagina donde el usuario se
 * encuentra ahora mismo, derivada del registro de metadata por ruta
 * (`PageContextService`, que ya resuelve rutas dinamicas como `/[orgSlug]/...`
 * y `/courses/[slug]`).
 *
 * Problema que resuelve: cuando el usuario pregunta "que puedes hacer",
 * SofLIA respondia de forma generica porque el prompt solo recibia un volcado
 * plano de TODAS las paginas de la plataforma, sin distinguir la pagina activa.
 * Esta seccion le da prioridad explicita a la pagina actual y a sus acciones
 * reales para que la respuesta sea especifica ("En esta pagina puedes ...").
 *
 * Es defensivo: nunca lanza. Si no hay match para la ruta, devuelve una
 * instruccion de respaldo que obliga a SofLIA a inferir el proposito de la
 * pagina desde el DOM (titulo, encabezados, contenido visible) en lugar de
 * caer en la lista generica de toda la plataforma.
 *
 * Lo consumen ambas rutas de chat (`/api/ai-chat` y `/api/lia/chat`) para que
 * el comportamiento sea consistente sin importar que widget atienda al usuario.
 */

import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { PageMetadata } from '../types'
import { PageContextService } from './page-context.service'

const MAX_FLOWS = 8
const MAX_COMPONENTS = 6
const MAX_DESCRIPTION_LENGTH = 160

/**
 * Convierte un `pageType` tecnico (ej: "business_panel_users") en una etiqueta
 * legible (ej: "business panel users"). Es solo una pista de seccion; el nombre
 * "bonito" real ya llega via el titulo del DOM en el prompt.
 */
function humanizePageType(pageType: string): string {
  return pageType
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}

function buildMatchedSection(pathname: string, metadata: PageMetadata): string {
  const lines: string[] = []

  lines.push('\n\n========================================')
  lines.push('QUE PUEDES HACER EN ESTA PAGINA (PRIORIDAD MAXIMA)')
  lines.push('========================================')
  lines.push(
    `El usuario se encuentra AHORA MISMO en: ${pathname} (seccion: ${humanizePageType(
      metadata.pageType,
    )}).`,
  )
  lines.push(
    'INSTRUCCION CRITICA: Si el usuario pregunta "que puedes hacer", "como me ' +
      'ayudas", "para que sirve esta pagina", "que hago aqui" o algo similar, ' +
      'DEBES responder de forma ESPECIFICA sobre ESTA pagina. Comienza con algo ' +
      'como "En esta pagina puedo ayudarte a..." y enumera SOLO las acciones ' +
      'reales listadas abajo. NUNCA respondas con una lista generica de toda la ' +
      'plataforma cuando la pregunta sea sobre la pagina actual.',
  )

  const flowNames = metadata.userFlows
    .map((flow) => flow.name?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, MAX_FLOWS)

  if (flowNames.length > 0) {
    lines.push('\nACCIONES QUE EL USUARIO PUEDE REALIZAR AQUI:')
    flowNames.forEach((name) => lines.push(`- ${name}`))
  }

  const componentLines = metadata.components
    .filter((component) => component.name && component.description)
    .slice(0, MAX_COMPONENTS)
    .map(
      (component) =>
        `- ${component.name}: ${truncate(component.description, MAX_DESCRIPTION_LENGTH)}`,
    )

  if (componentLines.length > 0) {
    lines.push('\nELEMENTOS Y SECCIONES DISPONIBLES EN ESTA PAGINA:')
    componentLines.forEach((line) => lines.push(line))
  }

  lines.push(
    '\nLa lista generica de paginas de la plataforma (si aparece mas abajo) es ' +
      'SOLO para sugerir navegacion a otras secciones cuando el usuario lo pida ' +
      'explicitamente. No la uses para describir lo que puedes hacer en la ' +
      'pagina actual.',
  )

  return lines.join('\n')
}

function buildFallbackSection(pathname: string): string {
  return (
    '\n\n========================================\n' +
    'QUE PUEDES HACER EN ESTA PAGINA (PRIORIDAD ALTA)\n' +
    '========================================\n' +
    `El usuario se encuentra AHORA MISMO en: ${pathname}.\n` +
    'No hay una ficha detallada de capacidades para esta ruta especifica. Si el ' +
    'usuario pregunta que puedes hacer o para que sirve esta pagina, INFIERELO a ' +
    'partir del titulo, los encabezados y el contenido visible de la pagina (ya ' +
    'incluidos en el contexto) y responde de forma especifica a esta pagina. ' +
    'Evita dar una lista generica de toda la plataforma; centrate en lo que ESTA ' +
    'pagina concreta permite hacer.'
  )
}

/**
 * Devuelve la seccion de capacidades enfocada en la pagina actual.
 *
 * @param pathname Ruta actual del usuario (ej: "/acme/business-panel/users").
 * @returns Texto para inyectar en el prompt, o '' si no hay pathname.
 */
export function buildCurrentPageCapabilitiesSection(pathname?: string | null): string {
  if (!pathname || typeof pathname !== 'string' || !pathname.trim()) {
    return ''
  }

  try {
    const metadata = PageContextService.getPageMetadata(pathname)
    return metadata
      ? buildMatchedSection(pathname, metadata)
      : buildFallbackSection(pathname)
  } catch (error) {
    // Defensa en profundidad: una falla resolviendo metadata NUNCA debe romper
    // la respuesta del chat. Degradamos a la instruccion de respaldo.
    techDebtLogger.warn(
      '[LIA] No se pudo resolver capacidades de la pagina actual',
      {
        pathname,
        error: error instanceof Error ? error.message : String(error),
      },
    )
    return buildFallbackSection(pathname)
  }
}
