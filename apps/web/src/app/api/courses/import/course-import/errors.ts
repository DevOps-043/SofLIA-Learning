import { NextResponse } from 'next/server'

export class CourseImportError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super(String(body.error || 'Course import error'))
  }
}

export function createImportErrorResponse(error: CourseImportError) {
  return NextResponse.json(error.body, { status: error.status })
}
