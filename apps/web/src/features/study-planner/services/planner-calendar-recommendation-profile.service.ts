import type { StudyPlannerUserContextApiData } from './planner-user-context-client.service'

export function formatSessionLength(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours} hora${hours > 1 ? 's' : ''}`
  }
  return `${minutes} minutos`
}

export function buildProfileDescription(
  userProfile: StudyPlannerUserContextApiData | null,
): string | null {
  if (!userProfile) return null
  const parts: string[] = []
  if (userProfile.userType === 'b2b' && userProfile.organization?.name) {
    parts.push(`trabajas en ${userProfile.organization.name}`)
  } else {
    parts.push('eres profesional independiente')
  }
  const role = userProfile.professionalProfile?.rol?.nombre
  const area = userProfile.professionalProfile?.area?.nombre
  if (role) parts.push(`como ${role}`)
  if (area) parts.push(`en el area de ${area}`)
  return parts.length > 0 ? parts.join(' ') : null
}

export function buildStudyPlannerNoEventsMessage(
  userProfile: StudyPlannerUserContextApiData | null,
): string {
  const profileDescription = buildProfileDescription(userProfile)
  return [
    profileDescription ? `He analizado tu perfil. Veo que ${profileDescription}.` : 'He analizado tu perfil.',
    '\n',
    'No encontre eventos programados en tu calendario para el proximo mes. Esto nos da total flexibilidad para disenar tu plan de estudios.',
    '\n',
    'Â¿Que dias de la semana prefieres estudiar? Â¿Y en que horario te concentras mejor: manana, tarde o noche?',
  ].join(' ')
}
