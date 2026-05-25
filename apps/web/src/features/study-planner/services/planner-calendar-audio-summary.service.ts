import type { StudyPlannerAudioSummaryParams } from './planner-calendar-recommendation.types'

export function buildStudyPlannerAudioSummary({
  calendarEventsCount,
  daysWithFreeTime,
  finalSlots,
}: StudyPlannerAudioSummaryParams): string {
  if (calendarEventsCount === 0) {
    return 'Calendario conectado. No encontre eventos en el proximo mes. Â¿Que dias y horarios prefieres para estudiar?'
  }
  if (finalSlots.length > 0) {
    const firstSlot = finalSlots[0]
    const timeStr = firstSlot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    return `Analice tu calendario del proximo mes. Te recomiendo estudiar el ${firstSlot.dayName} a las ${timeStr}. Â¿Te parece bien?`
  }
  if (daysWithFreeTime.length > 0) {
    const days = daysWithFreeTime.slice(0, 2).map((d) => d.dayName).join(' y ')
    return `Analice tu calendario del proximo mes. Te recomiendo estudiar los ${days}. Â¿Te parece bien?`
  }
  return 'Analice tu calendario del proximo mes. Tu agenda esta muy ocupada, pero podemos encontrar espacios para estudiar. Â¿Te parece bien?'
}
