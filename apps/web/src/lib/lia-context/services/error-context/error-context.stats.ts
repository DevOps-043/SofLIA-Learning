import { createErrorContextClient } from './error-context.client'
import { buildPageMatchFilter, emptyBugStats } from './error-context.utils'
import type { BugStatsForPage } from './error-context.types'

export async function getBugStatsForPage(currentPage: string): Promise<BugStatsForPage> {
  try {
    const supabase = await createErrorContextClient()
    const { data, error } = await supabase
      .from('reportes_problemas')
      .select('estado, categoria')
      .or(buildPageMatchFilter(currentPage))

    if (error || !data) return emptyBugStats()

    return data.reduce<BugStatsForPage>((stats, bug) => {
      stats.total += 1

      if (bug.estado === 'resuelto' || bug.estado === 'cerrado') {
        stats.resolved += 1
      } else {
        stats.open += 1
      }

      stats.byCategory[bug.categoria] = (stats.byCategory[bug.categoria] || 0) + 1
      return stats
    }, emptyBugStats())
  } catch (error) {
    console.error('[ErrorContextService] Exception getting bug stats:', error)
    return emptyBugStats()
  }
}
