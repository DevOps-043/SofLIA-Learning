import { buildRecommendationDistributionDetails } from './planner-calendar-recommendation-distribution.service'
import {
  buildProfileDescription,
  buildStudyPlannerNoEventsMessage,
  formatSessionLength,
} from './planner-calendar-recommendation-profile.service'
import type { StudyPlannerCalendarRecommendationParams } from './planner-calendar-recommendation.types'

function getApproachText(effectiveApproach: StudyPlannerCalendarRecommendationParams['effectiveApproach']): string {
  return effectiveApproach === 'corto' ? 'terminar rapido'
    : effectiveApproach === 'balance' ? 'ritmo equilibrado'
      : effectiveApproach === 'largo' ? 'tomarte tu tiempo'
        : 'sesiones'
}

export function buildStudyPlannerCalendarRecommendationMessage({
  busiestDays,
  calendarEventsCount,
  distributionResult,
  effectiveApproach,
  effectiveTargetDate,
  finalSlots,
  profileAvailability,
  provider,
  userProfile,
}: StudyPlannerCalendarRecommendationParams): string {
  if (calendarEventsCount === 0) return buildStudyPlannerNoEventsMessage(userProfile)

  const profileDescription = buildProfileDescription(userProfile)
  const introParts = [
    `Â¡Perfecto! Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} esta conectado.`,
    'He analizado tu perfil profesional y tu calendario.',
  ]
  if (profileDescription) introParts.push(`Veo que ${profileDescription}.`)
  introParts.push('\nHe encontrado multiples eventos en tu calendario durante el proximo mes.')
  if (busiestDays.length > 0) introParts.push(`Tus dias mas ocupados son: ${busiestDays.join(', ')}.`)

  let message = `${introParts.join(' ')}\n\n`
  if (finalSlots.length === 0) return message.trim()

  const recommendationParts = ['**MIS RECOMENDACIONES:**', '\n']

  if (profileAvailability) {
    const approachText = getApproachText(effectiveApproach)
    const targetDateText = effectiveTargetDate ? ` y tu objetivo de completar los cursos para ${effectiveTargetDate}` : ''
    const rolText = userProfile?.professionalProfile?.rol?.nombre ? ` como ${userProfile.professionalProfile.rol.nombre}` : ''
    const nivelText = userProfile?.professionalProfile?.nivel?.nombre ? ` (${userProfile.professionalProfile.nivel.nombre})` : ''
    const hoursPerDay = Math.round((profileAvailability.minutesPerDay / 60) * 10) / 10

    recommendationParts.push(
      `En base a tu perfil${rolText}${nivelText} y tu preferencia por **${approachText}**${targetDateText}, estimo que puedes dedicar aproximadamente ${hoursPerDay} hora${profileAvailability.minutesPerDay >= 120 ? 's' : ''} al dia para estudiar.`,
    )
    if (effectiveTargetDate) {
      recommendationParts.push(`He distribuido las sesiones de estudio hasta ${effectiveTargetDate} para asegurar que completes tus cursos a tiempo.`)
    }
    recommendationParts.push(
      `Te propongo estos horarios especificos para sesiones de ${formatSessionLength(profileAvailability.recommendedSessionLength)}${profileAvailability.recommendedBreak > 0 ? ` con descansos de ${profileAvailability.recommendedBreak} minutos` : ''}:`,
    )
  } else {
    recommendationParts.push('Basandome en los espacios libres que encontre en tu calendario, te sugiero estas sesiones de estudio:')
  }

  message += `${recommendationParts.join(' ')}\n`
  message += buildRecommendationDistributionDetails(distributionResult)

  if (distributionResult.slotsAfterTarget > 0 && effectiveTargetDate) {
    message += `\n**Nota:** He identificado ${distributionResult.slotsAfterTarget} espacios adicionales disponibles despues de tu fecha objetivo (${effectiveTargetDate}). Estos pueden ser utiles para repaso o actividades complementarias.`
  }

  return message.trim()
}
