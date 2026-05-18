import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server'

export function validateCourseImportApiKey(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.COURSEFORGE_API_KEY

  if (!validApiKey || apiKey !== validApiKey) {
    techDebtLogger.warn('[IMPORT API] Unauthorized - API key mismatch')
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API Key' },
      { status: 401 }
    )
  }

  return null
}
