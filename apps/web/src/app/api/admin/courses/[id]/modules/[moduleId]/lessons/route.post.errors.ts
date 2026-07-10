import { NextResponse } from 'next/server'

export function createCreateLessonErrorResponse(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
  const isSupabaseError = error && typeof error === 'object' && 'code' in error

  if (isSupabaseError) {
    const supabaseError = error as { code?: string; message?: string; details?: string }
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear lección en la base de datos',
        details: supabaseError.message || errorMessage,
        code: supabaseError.code,
      },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage || 'Error al crear lección',
    },
    { status: 500 },
  )
}
