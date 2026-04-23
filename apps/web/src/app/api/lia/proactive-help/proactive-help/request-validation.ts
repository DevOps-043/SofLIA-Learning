import { NextResponse } from 'next/server'
import type { ProactiveHelpRequest } from './types'

export async function readProactiveHelpRequest(request: Request) {
  const body = (await request.json()) as ProactiveHelpRequest

  if (!body.analysis) {
    return NextResponse.json({ error: 'Missing analysis data' }, { status: 400 })
  }

  return body
}
