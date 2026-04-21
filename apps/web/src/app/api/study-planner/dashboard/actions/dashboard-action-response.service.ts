import { NextResponse } from 'next/server'
import type { ActionResponse } from './dashboard-action.types'

export function buildActionErrorResponse(
  error: string,
  status: number,
): NextResponse<ActionResponse> {
  return NextResponse.json({ success: false, error }, { status })
}

export function buildActionSuccessResponse(params: {
  data?: Record<string, unknown>
  message: string
}): NextResponse<ActionResponse> {
  return NextResponse.json({
    success: true,
    message: params.message,
    ...(params.data ? { data: params.data } : {}),
  })
}
