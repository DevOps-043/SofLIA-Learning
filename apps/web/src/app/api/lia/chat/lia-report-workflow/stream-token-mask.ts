/**
 * Filtro de streaming para los bloques ocultos de reporte tecnico.
 *
 * El modelo escribe el bloque `[[BUG_REPORT_DRAFT:{...}]]` al final de su
 * respuesta. Cuando la respuesta se emite por SSE, el texto viaja en fragmentos
 * arbitrarios: sin este filtro el usuario veria el JSON interno en pantalla y el
 * unico modo de evitarlo seria borrar el bloque antes de persistirlo (que es
 * justamente lo que hacia desaparecer los reportes).
 *
 * El filtro retiene cualquier cola que todavia pueda convertirse en un marcador
 * y la descarta cuando el marcador queda completo. El texto crudo del modelo se
 * conserva aparte para persistir el borrador.
 */

const MARKER_PREFIXES = ['[[BUG_REPORT:', '[[BUG_REPORT_DRAFT:'] as const
const MARKER_TRIGGER = '['
const COMPLETE_MARKER_AT_START = /^\[\[BUG_REPORT(?:_DRAFT)?:\{[\s\S]*?\}\]\]/

export interface BugReportTokenStreamMask {
  /** Devuelve el texto seguro de mostrar para este fragmento. */
  push(chunk: string): string
  /** Devuelve el texto retenido que ya no puede ser un marcador. */
  flush(): string
}

function isMarkerPrefixOf(candidate: string): boolean {
  return MARKER_PREFIXES.some(prefix => prefix.startsWith(candidate))
}

function startsWithMarkerPrefix(candidate: string): boolean {
  return MARKER_PREFIXES.some(prefix => candidate.startsWith(prefix))
}

export function createBugReportTokenStreamMask(): BugReportTokenStreamMask {
  let pending = ''

  return {
    push(chunk: string): string {
      pending += chunk
      let visible = ''

      while (pending) {
        const triggerIndex = pending.indexOf(MARKER_TRIGGER)

        if (triggerIndex === -1) {
          visible += pending
          pending = ''
          break
        }

        visible += pending.slice(0, triggerIndex)
        const candidate = pending.slice(triggerIndex)

        // Marcador completo: se descarta del texto visible y se sigue leyendo.
        const completeMarker = candidate.match(COMPLETE_MARKER_AT_START)
        if (completeMarker) {
          pending = candidate.slice(completeMarker[0].length)
          continue
        }

        // Marcador a medio llegar: se retiene hasta el proximo fragmento.
        if (isMarkerPrefixOf(candidate) || startsWithMarkerPrefix(candidate)) {
          pending = candidate
          break
        }

        // Un corchete normal (enlaces markdown, listas, etc.): texto del usuario.
        visible += MARKER_TRIGGER
        pending = candidate.slice(MARKER_TRIGGER.length)
      }

      return visible
    },

    flush(): string {
      const remaining = pending
      pending = ''

      if (!remaining) return ''

      // Solo se retiene texto que aun podia ser un marcador; si el stream
      // termino a medias, ese resto es basura interna y no debe mostrarse.
      const isTruncatedMarker =
        isMarkerPrefixOf(remaining) || startsWithMarkerPrefix(remaining)

      return isTruncatedMarker ? '' : remaining
    },
  }
}
