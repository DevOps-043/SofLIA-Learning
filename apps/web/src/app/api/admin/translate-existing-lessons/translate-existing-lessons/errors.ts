import { NextResponse } from 'next/server'

export class TranslateExistingLessonsError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: Record<string, unknown>,
  ) {
    super(typeof payload.error === 'string' ? payload.error : 'Translation error')
  }
}

export function createTranslateErrorResponse(error: TranslateExistingLessonsError) {
  return NextResponse.json(error.payload, { status: error.status })
}
