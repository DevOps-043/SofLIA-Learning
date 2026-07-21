import type {
  ForensicEvent,
  ForensicEventTypeCount,
  ForensicEventType,
} from './user-forensics.types'

/**
 * Lógica pura de la línea de tiempo forense: mezcla eventos de todos los dominios,
 * ordena cronológicamente y deriva agregados. Sin dependencias de BD para poder
 * unit-testear el corazón del panel.
 */

/** Ordena eventos por `atUtc` descendente (más reciente primero); estable por id. */
export function sortForensicEventsDesc(events: ForensicEvent[]): ForensicEvent[] {
  return [...events].sort((a, b) => {
    const at = Date.parse(a.atUtc)
    const bt = Date.parse(b.atUtc)
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0
    if (Number.isNaN(at)) return 1
    if (Number.isNaN(bt)) return -1
    if (bt !== at) return bt - at
    return a.id.localeCompare(b.id)
  })
}

/** MAX(atUtc) — última actividad REAL, independiente del throttle de last_activity_at. */
export function deriveLastActivityAtUtc(events: ForensicEvent[]): string | null {
  let maxMs = Number.NEGATIVE_INFINITY
  let result: string | null = null
  for (const event of events) {
    const ms = Date.parse(event.atUtc)
    if (!Number.isNaN(ms) && ms > maxMs) {
      maxMs = ms
      result = event.atUtc
    }
  }
  return result
}

/** MIN(atUtc) — primer evento (inicio de la huella del usuario). */
export function deriveFirstActivityAtUtc(events: ForensicEvent[]): string | null {
  let minMs = Number.POSITIVE_INFINITY
  let result: string | null = null
  for (const event of events) {
    const ms = Date.parse(event.atUtc)
    if (!Number.isNaN(ms) && ms < minMs) {
      minMs = ms
      result = event.atUtc
    }
  }
  return result
}

/** Conteo por tipo, para el filtro/resumen del timeline. */
export function countForensicEventTypes(
  events: ForensicEvent[],
): ForensicEventTypeCount[] {
  const counts = new Map<ForensicEventType, number>()
  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}
