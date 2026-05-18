import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_STATS_COLORS } from './constants'
import type { ContentDistribution } from './types'

export async function getContentDistribution(): Promise<ContentDistribution[]> {
  try {
    const supabase = await createClient()
    const [
      { count: coursesCount },
      { count: communitiesCount },
      { count: promptsCount },
      { count: aiAppsCount },
    ] = await Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('communities').select('id', { count: 'exact', head: true }),
      supabase.from('ai_prompts').select('prompt_id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('ai_apps').select('app_id', { count: 'exact', head: true }),
    ])

    const counts = {
      courses: coursesCount || 0,
      communities: communitiesCount || 0,
      prompts: promptsCount || 0,
      aiApps: aiAppsCount || 0,
    }
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    if (total === 0) return []

    return [
      buildDistributionItem('Talleres', counts.courses, total, ADMIN_STATS_COLORS.courses),
      buildDistributionItem('Comunidades', counts.communities, total, ADMIN_STATS_COLORS.communities),
      buildDistributionItem('Prompts', counts.prompts, total, ADMIN_STATS_COLORS.prompts),
      buildDistributionItem('Apps de IA', counts.aiApps, total, ADMIN_STATS_COLORS.aiApps),
    ].filter((item) => item.count > 0)
  } catch (error) {
    techDebtLogger.error('Error getting content distribution:', error)
    return []
  }
}

function buildDistributionItem(
  category: string,
  count: number,
  total: number,
  color: string,
): ContentDistribution {
  return {
    category,
    count,
    percentage: Math.round((count / total) * 100),
    color,
  }
}
