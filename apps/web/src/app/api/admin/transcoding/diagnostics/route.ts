import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { isTranscodingEnabled } from '@/lib/media/server/transcoding-dispatcher.server'

export const runtime = 'nodejs'

/**
 * Reports the env-var state that the transcoding pipeline depends on,
 * plus a connectivity probe to the BG function endpoint.  Lets the
 * admin see at a glance which piece is missing when nothing fires.
 *
 * Never returns secret values — only booleans.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const netlifyUrl =
    process.env.NETLIFY_URL ?? process.env.URL ?? process.env.DEPLOY_URL ?? null
  const hasSecret = Boolean(process.env.TRANSCODING_INTERNAL_SECRET)
  const transcodingEnabled = isTranscodingEnabled()

  // Probe: HEAD the BG function endpoint.  We expect a 4xx (no auth header)
  // — that proves the function exists and is reachable.  A network error
  // or 5xx means the BG function isn't deployed or there's a routing issue.
  let bgFunctionReachable: boolean | null = null
  let probeStatus: number | null = null
  let probeError: string | null = null

  if (netlifyUrl) {
    const probeUrl = `${netlifyUrl.replace(/\/$/, '')}/.netlify/functions/transcode-video-background`
    try {
      const response = await fetch(probeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(10_000),
      })
      probeStatus = response.status
      // 401 (no/bad bearer) or 400 (bad body) both prove the function is
      // up and the route works.  Anything else is suspect.
      bgFunctionReachable = response.status === 401 || response.status === 400 || response.status === 202
    } catch (err) {
      probeError = err instanceof Error ? err.message : 'unknown'
      bgFunctionReachable = false
    }
  }

  return NextResponse.json({
    transcodingEnabled,
    netlifyUrl: netlifyUrl
      ? `${netlifyUrl.slice(0, 30)}${netlifyUrl.length > 30 ? '…' : ''}`
      : null,
    netlifyUrlSource: process.env.NETLIFY_URL
      ? 'NETLIFY_URL'
      : process.env.URL
        ? 'URL'
        : process.env.DEPLOY_URL
          ? 'DEPLOY_URL'
          : null,
    hasTranscodingInternalSecret: hasSecret,
    bgFunctionProbe: {
      reachable: bgFunctionReachable,
      status: probeStatus,
      error: probeError,
    },
    summary: buildSummary({ transcodingEnabled, netlifyUrl, hasSecret, bgFunctionReachable }),
  })
}

function buildSummary(input: {
  transcodingEnabled: boolean
  netlifyUrl: string | null
  hasSecret: boolean
  bgFunctionReachable: boolean | null
}): { healthy: boolean; problems: string[] } {
  const problems: string[] = []
  if (!input.transcodingEnabled) {
    problems.push('VIDEO_TRANSCODING_ENABLED no es "true" en Netlify')
  }
  if (!input.netlifyUrl) {
    problems.push('NETLIFY_URL / URL / DEPLOY_URL no están disponibles en runtime')
  }
  if (!input.hasSecret) {
    problems.push('TRANSCODING_INTERNAL_SECRET no está configurado en Netlify')
  }
  if (input.netlifyUrl && input.bgFunctionReachable === false) {
    problems.push('La función transcode-video-background no responde — verifica que el deploy la incluya')
  }
  return { healthy: problems.length === 0, problems }
}
