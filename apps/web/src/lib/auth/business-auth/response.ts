import { NextResponse } from 'next/server'
import type { AuthFailure } from './types'

export function createBusinessAuthErrorResponse(error: AuthFailure): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error.message,
    },
    { status: error.status },
  )
}
