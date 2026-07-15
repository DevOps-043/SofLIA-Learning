import { describe, expect, it } from 'vitest'

import {
  getCourseManagementEnrollmentStatusLabel,
} from '../CourseManagementStudentDetails.service'

describe('CourseManagementStudentDetails.service', () => {
  it('maps enrollment statuses to labels', () => {
    expect(getCourseManagementEnrollmentStatusLabel('completed')).toBe('Completado')
    expect(getCourseManagementEnrollmentStatusLabel('active')).toBe('Activo')
    expect(getCourseManagementEnrollmentStatusLabel('paused')).toBe('Pausado')
    expect(getCourseManagementEnrollmentStatusLabel('cancelled')).toBe('Cancelado')
    expect(getCourseManagementEnrollmentStatusLabel('unknown')).toBe('Desconocido')
  })
})
