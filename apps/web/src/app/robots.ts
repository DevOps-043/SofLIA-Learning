import type { MetadataRoute } from 'next'
import { resolveAppBaseUrl } from '@/lib/security/agent-policy'

export default function robots(): MetadataRoute.Robots {
  return {
    host: resolveAppBaseUrl(),
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/news', '/courses/', '/courses/*'],
        disallow: [
          '/api/',
          '/api/security/',
          '/auth/',
          '/admin/',
          '/dashboard',
          '/profile',
          '/account-settings',
          '/study-planner',
          '/certificates',
          '/business-panel/',
          '/business-user/',
          '/verification',
          '/*/business-panel/',
          '/*/business-user/',
        ],
      },
    ],
  }
}
