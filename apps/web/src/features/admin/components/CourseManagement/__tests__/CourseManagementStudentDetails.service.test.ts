import { describe, expect, it } from 'vitest'

import {
  buildCourseManagementStudentInsight,
  getCourseManagementEnrollmentStatusLabel,
  getDominantStudyPeriod,
} from '../CourseManagementStudentDetails.service'

describe('CourseManagementStudentDetails.service', () => {
  it('returns the dominant study period when slots exist', () => {
    expect(
      getDominantStudyPeriod([
        { periodo: 'Manana (6am-12pm)', porcentaje: 30, color: '#F59E0B' },
        { periodo: 'Noche (6pm-12am)', porcentaje: 60, color: '#10B981' },
      ]),
    ).toBe('noche (6pm-12am)')
  })

  it('builds a readable insight from study session metrics', () => {
    expect(
      buildCourseManagementStudentInsight({
        totalCourseStudyTime: 12,
        totalStudyTime: 12,
        studyStreak: 4,
        weeklyProgress: [],
        dailyStudyTime: [],
        totalSessions: 8,
        avgSessionDuration: 42,
        weeklyFrequency: 5,
        preferredTimeSlots: [
          { periodo: 'Tarde (12pm-6pm)', porcentaje: 55, color: '#00D4B3' },
          { periodo: 'Noche (6pm-12am)', porcentaje: 45, color: '#10B981' },
        ],
        activeDays: [],
        lastSession: { hoursAgo: 6 },
      }),
    ).toContain('tarde (12pm-6pm)')
  })

  it('falls back when there is not enough study data', () => {
    expect(buildCourseManagementStudentInsight(null)).toBe(
      'Aun no hay suficientes datos para generar insights personalizados.',
    )
  })

  it('maps enrollment statuses to labels', () => {
    expect(getCourseManagementEnrollmentStatusLabel('completed')).toBe('Completado')
    expect(getCourseManagementEnrollmentStatusLabel('active')).toBe('Activo')
    expect(getCourseManagementEnrollmentStatusLabel('paused')).toBe('Pausado')
    expect(getCourseManagementEnrollmentStatusLabel('cancelled')).toBe('Cancelado')
    expect(getCourseManagementEnrollmentStatusLabel('unknown')).toBe('Desconocido')
  })
})
