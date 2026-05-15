import type { BusinessCourseDetail } from '../types/business-course-detail.types'

async function parseJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

async function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return
  }

  const payload = await parseJson(response)
  const message =
    (typeof payload.error === 'string' && payload.error) ||
    (typeof payload.message === 'string' && payload.message) ||
    fallbackMessage

  throw new Error(message)
}

export class BusinessCourseDetailService {
  static async getCourseDetail(orgSlug: string, courseId: string): Promise<BusinessCourseDetail> {
    const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await ensureOk(response, 'Error al cargar el curso')
    const payload = await parseJson(response)

    if (!payload.success || !payload.course) {
      throw new Error(typeof payload.error === 'string' ? payload.error : 'Error al cargar el curso')
    }

    return payload.course as BusinessCourseDetail
  }

  static async purchaseCourse(orgSlug: string, courseId: string) {
    const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/purchase`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    await ensureOk(response, 'Error al adquirir el curso')
    return await parseJson(response)
  }
}
