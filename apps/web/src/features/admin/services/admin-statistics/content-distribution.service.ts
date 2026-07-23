import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_STATS_COLORS } from './constants'
import { statsTable } from './stats-query.client'
import type { ContentDistribution } from './types'

export async function getContentDistribution(): Promise<ContentDistribution[]> {
  try {
    const supabase = await createClient()
    // Solo entidades de contenido B2B que existen: cursos y rutas de aprendizaje.
    // Las categorías consumer (comunidades, prompts, apps de IA) se retiraron con
    // sus tablas; contarlas producía 404.
    const [
      { count: coursesCount },
      { count: learningPathsCount },
    ] = await Promise.all([
      statsTable<unknown>(supabase, 'courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      statsTable<unknown>(supabase, 'learning_paths').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    const counts = {
      courses: coursesCount || 0,
      learningPaths: learningPathsCount || 0,
    }
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    if (total === 0) return []

    return [
      buildDistributionItem('Cursos', counts.courses, total, ADMIN_STATS_COLORS.courses),
      buildDistributionItem('Rutas de aprendizaje', counts.learningPaths, total, ADMIN_STATS_COLORS.prompts),
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
