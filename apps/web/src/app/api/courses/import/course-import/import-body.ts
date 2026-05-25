import { logger as techDebtLogger } from '@/lib/utils/logger'
import { apiError } from '@/lib/api/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const courseImportBodySchema = z.record(z.unknown())

export async function readCourseImportBody(
  request: Request
): Promise<
  | { body: Record<string, unknown>; success: true }
  | { response: NextResponse; success: false }
> {
  try {
    const rawBody = await request.text()
    const parsedJson = rawBody.trim() ? JSON.parse(rawBody) : {}
    const parsedBody = courseImportBodySchema.safeParse(parsedJson)

    if (!parsedBody.success) {
      return {
        response: apiError('INVALID_JSON', 'Invalid JSON body', 400),
        success: false,
      }
    }

    return { body: parsedBody.data, success: true }
  } catch (error) {
    techDebtLogger.error('[IMPORT API] JSON Parse Error:', error)
    return {
      response: apiError('INVALID_JSON', 'Invalid JSON body', 400),
      success: false,
    }
  }
}
