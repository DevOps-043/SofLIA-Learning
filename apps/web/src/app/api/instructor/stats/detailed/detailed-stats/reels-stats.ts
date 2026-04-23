import { getDayKey } from './date-range'
import { incrementCounter } from './map-utils'
import type { CountMap, SupabaseServerClient } from './shared-types'

export async function getReelsStats(
  supabase: SupabaseServerClient,
  instructorId: string,
  startDate: Date,
  endDate: Date,
) {
  const { data: reels } = await supabase
    .from('reels')
    .select('id, title, view_count, like_count, share_count, comment_count, is_active, created_at, published_at')
    .eq('created_by', instructorId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const stats = {
    totalReels: reels?.length || 0,
    activeReels: (reels ?? []).filter((item) => item.is_active).length,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0,
    viewsByDate: {} as CountMap,
    likesByDate: {} as CountMap,
    engagementByReel: [] as Array<{ reelId: string; reelTitle: string; views: number; likes: number; shares: number; comments: number; engagementRate: number }>,
    topReels: [] as Array<{ reelId: string; reelTitle: string; views: number }>,
  }

  ;(reels ?? []).forEach((item) => {
    const views = item.view_count || 0
    const likes = item.like_count || 0
    const shares = item.share_count || 0
    const comments = item.comment_count || 0
    const dayKey = getDayKey(item.published_at || item.created_at)
    stats.totalViews += views
    stats.totalLikes += likes
    stats.totalShares += shares
    stats.totalComments += comments
    incrementCounter(stats.viewsByDate, dayKey, views)
    incrementCounter(stats.likesByDate, dayKey, likes)
    stats.engagementByReel.push({ reelId: item.id, reelTitle: item.title, views, likes, shares, comments, engagementRate: views > 0 ? ((likes + shares + comments) / views) * 100 : 0 })
  })

  stats.topReels = [...stats.engagementByReel]
    .sort((left, right) => right.views - left.views)
    .slice(0, 5)
    .map((item) => ({ reelId: item.reelId, reelTitle: item.reelTitle, views: item.views }))

  return stats
}
