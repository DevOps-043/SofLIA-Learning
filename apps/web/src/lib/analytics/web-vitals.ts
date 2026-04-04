import type { NextWebVitalsMetric } from 'next/app'

type Gtag = (command: 'event', eventName: string, params: Record<string, unknown>) => void

type AnalyticsWindow = Window & {
  gtag?: Gtag
}

/**
 * Reporta Web Vitals a servicio de analytics
 * Se puede integrar con Google Analytics, Vercel Analytics, Sentry, etc.
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label,
    startTime: metric.startTime,
    attribution: metric.attribution,
  })

  const analyticsWindow = typeof window !== 'undefined' ? (window as AnalyticsWindow) : null
  if (analyticsWindow?.gtag) {
    analyticsWindow.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }

  const url = '/api/analytics/web-vitals'

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body)
  } else {
    fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Silent fail — metrics are best-effort
    })
  }
}
