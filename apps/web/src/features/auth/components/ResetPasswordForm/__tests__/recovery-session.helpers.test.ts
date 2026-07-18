import { describe, expect, it, vi } from 'vitest'

import {
  establishSupabaseRecoverySession,
  parseRecoveryUrlError,
} from '../recovery-session.helpers'

type SessionResult = {
  data: { session: { user: unknown } | null }
  error: { message: string } | null
}

function buildSupabaseMock(params: {
  sessions: Array<{ user: unknown } | null>
  exchange?: SessionResult
}) {
  const getSession = vi.fn<() => Promise<SessionResult>>()
  params.sessions.forEach((session) => {
    getSession.mockResolvedValueOnce({ data: { session }, error: null })
  })

  const exchangeCodeForSession = vi
    .fn<() => Promise<SessionResult>>()
    .mockResolvedValue(
      params.exchange ?? {
        data: { session: null },
        error: { message: 'code already used' },
      },
    )

  return { auth: { getSession, exchangeCodeForSession } }
}

describe('parseRecoveryUrlError', () => {
  it('detecta enlace expirado por error_code en el hash', () => {
    expect(
      parseRecoveryUrlError(
        '?mode=supabase',
        '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      ),
    ).toBe('expired')
  })

  it('detecta enlace expirado por error_code en el query string', () => {
    expect(parseRecoveryUrlError('?error=access_denied&error_code=otp_expired', '')).toBe(
      'expired',
    )
  })

  it('clasifica otros errores de la URL como inválidos', () => {
    expect(parseRecoveryUrlError('', '#error=access_denied&error_code=other')).toBe('invalid')
    expect(parseRecoveryUrlError('?error=server_error', '')).toBe('invalid')
  })

  it('devuelve null cuando no hay parámetros de error', () => {
    expect(parseRecoveryUrlError('?mode=supabase&code=abc', '')).toBeNull()
    expect(parseRecoveryUrlError('', '#access_token=xyz')).toBeNull()
  })
})

describe('establishSupabaseRecoverySession', () => {
  it('usa la sesión ya establecida por detectSessionInUrl sin canjear el código', async () => {
    const supabase = buildSupabaseMock({ sessions: [{ user: { id: 'u1' } }] })

    await expect(establishSupabaseRecoverySession(supabase, 'code-1')).resolves.toBe(true)
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('canjea el código manualmente cuando no hay sesión previa', async () => {
    const supabase = buildSupabaseMock({
      sessions: [null],
      exchange: { data: { session: { user: { id: 'u1' } } }, error: null },
    })

    await expect(establishSupabaseRecoverySession(supabase, 'code-1')).resolves.toBe(true)
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('code-1')
  })

  it('re-verifica la sesión cuando el canje falla porque el código ya fue consumido', async () => {
    const supabase = buildSupabaseMock({
      sessions: [null, { user: { id: 'u1' } }],
    })

    await expect(establishSupabaseRecoverySession(supabase, 'code-1')).resolves.toBe(true)
  })

  it('devuelve false cuando el canje falla y no existe sesión (enlace realmente inválido)', async () => {
    const supabase = buildSupabaseMock({ sessions: [null, null] })

    await expect(establishSupabaseRecoverySession(supabase, 'code-1')).resolves.toBe(false)
  })

  it('devuelve false sin código y sin sesión', async () => {
    const supabase = buildSupabaseMock({ sessions: [null] })

    await expect(establishSupabaseRecoverySession(supabase, null)).resolves.toBe(false)
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })
})
