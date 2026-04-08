import { NextResponse } from 'next/server'
import { buildLlmsPolicy } from '@/lib/security/agent-policy'

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse(buildLlmsPolicy(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
