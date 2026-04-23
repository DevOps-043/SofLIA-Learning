import { getDayKey } from './date-range'
import { incrementCounter } from './map-utils'
import type { CountMap, SupabaseServerClient } from './shared-types'

function readNewsMetrics(metrics: unknown) {
  if (!metrics || typeof metrics !== 'object') return { views: 0, comments: 0 }
  const parsed = metrics as { views?: number; comments?: number }
  return { views: parsed.views || 0, comments: parsed.comments || 0 }
}

export async function getNewsStats(
  supabase: SupabaseServerClient,
  instructorId: string,
  startDate: Date,
  endDate: Date,
) {
  const { data: news } = await supabase
    .from('news')
    .select('id, title, status, metrics, created_at, published_at')
    .eq('created_by', instructorId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const stats = {
    totalNews: news?.length || 0,
    publishedNews: (news ?? []).filter((item) => item.status === 'published').length,
    totalViews: 0,
    totalComments: 0,
    viewsByDate: {} as CountMap,
    commentsByDate: {} as CountMap,
    engagementByNews: [] as Array<{ newsId: string; newsTitle: string; views: number; comments: number; engagementRate: number }>,
    topNews: [] as Array<{ newsId: string; newsTitle: string; views: number }>,
  }

  ;(news ?? []).forEach((item) => {
    const { views, comments } = readNewsMetrics(item.metrics)
    const dayKey = getDayKey(item.published_at || item.created_at)
    stats.totalViews += views
    stats.totalComments += comments
    incrementCounter(stats.viewsByDate, dayKey, views)
    incrementCounter(stats.commentsByDate, dayKey, comments)
    stats.engagementByNews.push({ newsId: item.id, newsTitle: item.title, views, comments, engagementRate: views > 0 ? (comments / views) * 100 : 0 })
  })

  stats.topNews = [...stats.engagementByNews]
    .sort((left, right) => right.views - left.views)
    .slice(0, 5)
    .map((item) => ({ newsId: item.newsId, newsTitle: item.newsTitle, views: item.views }))

  return stats
}
