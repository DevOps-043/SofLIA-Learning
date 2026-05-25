import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import type { ErrorWithDetails } from './types';

export function getErrorDetails(error: unknown): ErrorWithDetails {
  return error && typeof error === 'object' ? error as ErrorWithDetails : {};
}

export function jsonError(error: string, status: number, details?: string) {
  return NextResponse.json(
    { success: false, error, ...(details ? { details } : {}) },
    { status },
  );
}

export function missingChatTablesError(
  error: Pick<PostgrestError, 'code' | 'message'> | null | undefined,
  fallbackMessage: string,
) {
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    return jsonError(
      'Las tablas de chat no están disponibles. Por favor, ejecuta la migración de base de datos.',
      500,
      error?.message,
    );
  }

  return jsonError(fallbackMessage, 500, error?.message || 'Error desconocido');
}
