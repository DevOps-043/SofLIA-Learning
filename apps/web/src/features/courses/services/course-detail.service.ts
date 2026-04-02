import type { CourseDetailResponse } from '../types/course-detail.types'

export class CourseDetailService {
  static async getCourseDetail(slug: string, language: string) {
    const response = await fetch(`/api/courses/${slug}/full?lang=${language}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Curso no encontrado')
    }

    return await response.json() as CourseDetailResponse
  }

  static async purchaseCourse(slug: string) {
    const response = await fetch(`/api/courses/${slug}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json() as {
      error?: string
      data?: {
        course_title?: string
      }
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error al adquirir el curso')
    }

    return data
  }

  static async getPurchaseState(slug: string) {
    const response = await fetch(`/api/courses/${slug}/check-purchase`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return false
    }

    const payload = await response.json() as { isPurchased?: boolean }
    return payload.isPurchased || false
  }
}
