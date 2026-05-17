import type {
  StudyPlannerAvailabilityEstimate,
  StudyPlannerAvailabilityEstimateInput,
} from './planner-calendar-analysis.types'

export function calculateStudyPlannerEstimatedAvailability(
  profile: StudyPlannerAvailabilityEstimateInput,
): StudyPlannerAvailabilityEstimate {
  let baseMinutesPerDay = 60
  let workloadMultiplier = 1.0
  let recommendedSessionLength = 30
  let recommendedBreak = 5
  const reasoning: string[] = []

  switch (profile.studyApproach) {
    case 'corto':
      baseMinutesPerDay = 90
      recommendedSessionLength = 75
      recommendedBreak = 15
      reasoning.push('Sesiones largas de 60-90 min para terminar rapido')
      break
    case 'largo':
      baseMinutesPerDay = 60
      recommendedSessionLength = 25
      recommendedBreak = 5
      reasoning.push('Sesiones cortas de 20-35 min para aprender sin prisa')
      break
    case 'balance':
    default:
      baseMinutesPerDay = 75
      recommendedSessionLength = 45
      recommendedBreak = 10
      reasoning.push('Sesiones equilibradas de 45-60 min')
      break
  }

  const nivel = profile.nivel?.toLowerCase() || ''

  if (nivel.includes('c-level') || nivel.includes('ceo') || nivel.includes('director') || nivel.includes('fundador')) {
    workloadMultiplier = 0.5
    reasoning.push('Como ejecutivo de alto nivel, tu agenda es muy demandante')
  } else if (nivel.includes('gerente') || nivel.includes('manager') || nivel.includes('lider') || nivel.includes('jefe')) {
    workloadMultiplier = 0.65
    reasoning.push('Como gerente o lider, tienes responsabilidades de gestion importantes')
  } else if (nivel.includes('senior') || nivel.includes('especialista')) {
    workloadMultiplier = 0.75
    reasoning.push('Como profesional senior, tienes proyectos complejos pero autonomia')
  } else if (nivel.includes('junior') || nivel.includes('trainee') || nivel.includes('practicante')) {
    workloadMultiplier = 1.0
    reasoning.push('En tu etapa profesional, el aprendizaje es prioritario')
  } else {
    workloadMultiplier = 0.8
  }

  const empleados = profile.maxEmpleados || 0
  if (empleados > 500) {
    workloadMultiplier *= 0.8
    reasoning.push(`En una empresa grande (+${empleados} empleados), hay mas procesos y reuniones`)
  } else if (empleados > 100) {
    workloadMultiplier *= 0.9
    reasoning.push('En una empresa mediana, hay balance entre agilidad y estructura')
  } else if (empleados > 0 && empleados <= 10) {
    workloadMultiplier *= 1.1
    reasoning.push('En una empresa pequena tienes mas flexibilidad pero multiples roles')
  }

  if (profile.userType === 'b2c') {
    workloadMultiplier *= 1.2
    reasoning.push('Como profesional independiente, tienes mas control de tu horario')
  }

  const adjustedMinutesPerDay = Math.round(baseMinutesPerDay * workloadMultiplier)
  const weeklyMinutes = adjustedMinutesPerDay * 5

  return {
    minutesPerDay: adjustedMinutesPerDay,
    weeklyMinutes,
    recommendedSessionLength,
    recommendedBreak,
    reasoning,
    sessionsPerWeek: Math.ceil(weeklyMinutes / recommendedSessionLength),
  }
}
