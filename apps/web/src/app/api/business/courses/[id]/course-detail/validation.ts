import { BusinessCourseDetailError } from './errors'

export function validateCourseId(courseId: string) {
  if (!courseId || courseId === 'undefined' || courseId === 'null') {
    throw new BusinessCourseDetailError(400, 'ID de curso no valido')
  }
}
