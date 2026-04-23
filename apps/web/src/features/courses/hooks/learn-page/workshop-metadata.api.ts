import { buildWorkshopMetadataContext } from './learn-page.service'
import type { WorkshopMetadataResponse } from './learn-data.types'

export async function loadWorkshopMetadataContext(params: {
  courseId: string
  slug: string
  userJobTitle?: string
}) {
  try {
    const response = await fetch(`/api/workshops/${params.courseId}/metadata`)

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as WorkshopMetadataResponse

    if (!data.success || !data.metadata) {
      return null
    }

    return buildWorkshopMetadataContext({
      metadata: data.metadata,
      slug: params.slug,
      userJobTitle: params.userJobTitle,
    })
  } catch (error) {
    console.warn('No se pudieron cargar metadatos del taller para LIA:', error)
    return null
  }
}
