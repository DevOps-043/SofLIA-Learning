import { NextResponse } from 'next/server'

export class BusinessCourseDetailError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string,
  ) {
    super(publicMessage)
  }
}

export function createErrorResponse(error: BusinessCourseDetailError) {
  return NextResponse.json(
    { success: false, error: error.publicMessage },
    { status: error.status },
  )
}

export function createUnexpectedErrorResponse(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: `Error al obtener detalles del curso: ${message}`,
    },
    { status: 500 },
  )
}
