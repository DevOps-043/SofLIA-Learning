import { NextResponse } from 'next/server'

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido'
}

export function createPersonalizationErrorResponse(
  _error: unknown,
  fallbackMessage: string,
  status = 500,
) {
  return NextResponse.json(
    {
      error: fallbackMessage,
      success: false,
    },
    { status },
  )
}
