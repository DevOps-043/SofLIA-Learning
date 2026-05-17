import { createErrorContextClient } from './error-context.client'
import { SIMILAR_BUG_SELECT } from './error-context.select'
import { buildPageMatchFilter, emptyBugStats } from './error-context.utils'
import type { BugStatsForPage, SimilarBug } from './error-context.types'

async function safelyLoadBugs(loader: () => Promise<SimilarBug[]>): Promise<SimilarBug[]> {
  try {
    return await loader()
  } catch (error) {
    console.error('[ErrorContextService] Error loading bugs:', error)
    return []
  }
}

export function getSimilarBugs(currentPage: string, limit: number = 5): Promise<SimilarBug[]> {
  return safelyLoadBugs(async () => {
    const supabase = await createErrorContextClient()
    const { data, error } = await supabase
      .from('reportes_problemas')
      .select(SIMILAR_BUG_SELECT)
      .or(buildPageMatchFilter(currentPage))
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  })
}

export function getUserRecentBugs(userId: string, limit: number = 3): Promise<SimilarBug[]> {
  return safelyLoadBugs(async () => {
    const supabase = await createErrorContextClient()
    const { data, error } = await supabase
      .from('reportes_problemas')
      .select(SIMILAR_BUG_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  })
}

export function getOpenBugsForPage(currentPage: string): Promise<SimilarBug[]> {
  return safelyLoadBugs(async () => {
    const supabase = await createErrorContextClient()
    const { data, error } = await supabase
      .from('reportes_problemas')
      .select(SIMILAR_BUG_SELECT)
      .or(buildPageMatchFilter(currentPage))
      .neq('estado', 'resuelto')
      .neq('estado', 'cerrado')
      .order('prioridad', { ascending: true })
      .limit(5)

    if (error) throw error
    return data || []
  })
}
