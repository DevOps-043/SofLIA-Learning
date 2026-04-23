import { NextResponse } from 'next/server'

export class HierarchyChatsError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: Record<string, unknown>,
  ) {
    super(typeof payload.error === 'string' ? payload.error : 'Hierarchy chat error')
  }
}

export function createHierarchyChatsErrorResponse(error: HierarchyChatsError) {
  return NextResponse.json(error.payload, { status: error.status })
}

export function isMissingChatTableError(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || Boolean(error?.message?.includes('does not exist'))
}

export function createMissingChatTableError(details?: string) {
  return new HierarchyChatsError(500, {
    success: false,
    error:
      'Las tablas de chat no están disponibles. Por favor, ejecuta la migración de base de datos.',
    details,
  })
}
