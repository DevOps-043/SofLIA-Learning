import type { StudyPlannerCalendarEventLike } from '../types/planner-schedule.types'
import type { StudyPlannerEventContext } from './planner-calendar-analysis.types'

function getEventDurationMinutes(event: StudyPlannerCalendarEventLike): number {
  return event.end && event.start
    ? (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60)
    : 0
}

export function analyzeStudyPlannerEventContext(
  event: StudyPlannerCalendarEventLike,
): StudyPlannerEventContext {
  const title = (event.title || '').toLowerCase()
  const description = (event.description || '').toLowerCase()
  const combined = `${title} ${description}`

  if (combined.match(/\b(presentaci[oÃ³]n|exposici[oÃ³]n|pitch|demo|demostraci[oÃ³]n|exponer|speak|keynote)\b/i)) {
    return {
      type: 'presentation',
      mentalFatigue: 'high',
      requiresRestAfter: true,
      description: 'presentacion o exposicion',
    }
  }

  if (combined.match(/\b(reuni[oÃ³]n|meeting|junta|conferencia|llamada|call|zoom|teams|google meet)\b/i)) {
    const duration = getEventDurationMinutes(event)

    if (duration > 60 || combined.match(/\b(importante|cr[iÃ­]tica|estrat[eÃ©]gica|decisi[oÃ³]n|evaluaci[oÃ³]n)\b/i)) {
      return {
        type: 'meeting',
        mentalFatigue: 'high',
        requiresRestAfter: true,
        description: 'reunion importante',
      }
    }

    return {
      type: 'meeting',
      mentalFatigue: 'medium',
      requiresRestAfter: false,
      description: 'reunion',
    }
  }

  if (combined.match(/\b(clase|seminario|taller|workshop|curso|m[oÃ³]dulo|lecci[oÃ³]n)\b/i)) {
    const duration = getEventDurationMinutes(event)

    if (duration > 120 || combined.match(/\b(intensivo|avanzado|complejo|dif[iÃ­]cil|pesado)\b/i)) {
      return {
        type: 'heavy_class',
        mentalFatigue: 'high',
        requiresRestAfter: true,
        description: 'clase pesada o seminario intensivo',
      }
    }

    return {
      type: 'normal',
      mentalFatigue: 'medium',
      requiresRestAfter: false,
      description: 'clase o actividad',
    }
  }

  if (combined.match(/\b(examen|evaluaci[oÃ³]n|prueba|test|ex[aÃ¡]men|final|parcial)\b/i)) {
    return {
      type: 'exam',
      mentalFatigue: 'high',
      requiresRestAfter: true,
      description: 'examen o evaluacion',
    }
  }

  if (combined.match(/\b(conferencia|congreso|simposio|convenci[oÃ³]n|evento|summit)\b/i)) {
    return {
      type: 'conference',
      mentalFatigue: 'high',
      requiresRestAfter: true,
      description: 'conferencia o evento importante',
    }
  }

  return {
    type: 'normal',
    mentalFatigue: 'low',
    requiresRestAfter: false,
    description: 'evento',
  }
}
