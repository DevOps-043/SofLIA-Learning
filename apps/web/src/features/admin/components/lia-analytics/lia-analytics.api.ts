import type { LiaAnalyticsData, LiaAnalyticsPeriod, LiaAnalyticsProvider } from './lia-analytics.types'

export async function fetchLiaAnalytics(period: LiaAnalyticsPeriod, provider: LiaAnalyticsProvider) {
  const timestamp = Date.now()
  const response = await fetch(`/api/admin/lia-analytics?period=${period}&provider=${provider}&_t=${timestamp}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    },
  })
  const result = await response.json()

  if (!result.success) throw new Error(result.error || 'load_failed')
  return result.data as LiaAnalyticsData
}

export function exportLiaAnalyticsCsv(data: LiaAnalyticsData, period: LiaAnalyticsPeriod, headers: string[]) {
  const rows = data.costsByPeriod.map((item) => [
    item.date,
    item.cost.toFixed(6),
    item.tokens.toString(),
    item.messages.toString(),
  ])
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `lia-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
