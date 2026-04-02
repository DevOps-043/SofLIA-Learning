import type { AuthFailure, AuthResult } from './types'

export function authSuccess<T>(value: T): AuthResult<T> {
  return { ok: true, value }
}

export function authFailure(status: number, message: string): AuthResult<never> {
  return { ok: false, error: { status, message } }
}

export function isAuthFailure<T>(
  result: AuthResult<T>,
): result is { ok: false; error: AuthFailure } {
  return !result.ok
}
