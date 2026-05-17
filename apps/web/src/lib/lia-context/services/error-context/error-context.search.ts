import { createErrorContextClient } from './error-context.client'
import { SIMILAR_BUG_SELECT } from './error-context.select'
import type { SimilarBug } from './error-context.types'

export async function searchBugsByKeywords(
  keywords: string[],
  limit: number = 5,
): Promise<SimilarBug[]> {
  try {
    const supabase = await createErrorContextClient()
    let query = supabase
      .from('reportes_problemas')
      .select(SIMILAR_BUG_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (keywords.length > 0) {
      const orConditions = keywords
        .map((term) => `titulo.ilike.%${term}%,descripcion.ilike.%${term}%`)
        .join(',')
      query = query.or(orConditions)
    }

    const { data, error } = await query
    if (error) throw error

    return data || []
  } catch (error) {
    console.error('[ErrorContextService] Exception searching bugs:', error)
    return []
  }
}
