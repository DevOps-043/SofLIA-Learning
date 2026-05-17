import type { StudyApproach } from '../types/planner-ui.types'

export interface StudyPlannerAvailabilityEstimateInput {
  rol: string | null
  nivel: string | null
  tamanoEmpresa: string | null
  minEmpleados: number | null
  maxEmpleados: number | null
  userType: 'b2b' | 'b2c' | null
  studyApproach?: StudyApproach | null
  targetDate?: string | null
}

export interface StudyPlannerAvailabilityEstimate {
  minutesPerDay: number
  weeklyMinutes: number
  recommendedSessionLength: number
  recommendedBreak: number
  reasoning: string[]
  sessionsPerWeek: number
}

export interface StudyPlannerEventContext {
  type: 'meeting' | 'presentation' | 'heavy_class' | 'exam' | 'workshop' | 'conference' | 'normal' | 'other'
  mentalFatigue: 'high' | 'medium' | 'low'
  requiresRestAfter: boolean
  description: string
}
