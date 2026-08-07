import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

import { deriveCodeChallenge } from '@/lib/auth/desktop-sso'
import {
  buildDesktopHandoffUrl,
  consumeDesktopSsoTicket,
  generateDesktopAccessProof,
  hasActiveMembership,
  issueDesktopSsoTicket,
} from '../desktop-sso.service'

const VERIFIER = 'v'.repeat(43)
const STATE = 's'.repeat(22)
const TICKET = 'a'.repeat(64)

interface SupabaseMockOptions {
  consumeRows?: Array<{ code_challenge: string; user_id: string }>
  generateLinkHash?: string | null
  insertError?: { message: string } | null
  membershipId?: string | null
  userEmail?: string | null
}

const insertedRows: Array<Record<string, unknown>> = []

function createSupabaseMock(options: SupabaseMockOptions = {}) {
  return {
    auth: {
      admin: {
        generateLink: vi.fn(async () => ({
          data: options.generateLinkHash === null
            ? { properties: null }
            : { properties: { hashed_token: options.generateLinkHash ?? 'hash-123' } },
          error: null,
        })),
        getUserById: vi.fn(async () => ({
          data: { user: options.userEmail === null ? null : { email: options.userEmail ?? 'persona@soflia.ai' } },
          error: null,
        })),
      },
    },
    from: vi.fn(() => ({
      insert: vi.fn(async (values: Record<string, unknown>) => {
        insertedRows.push(values)
        return { error: options.insertError ?? null }
      }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: options.membershipId ? { id: options.membershipId } : null,
                error: null,
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(async () => ({ data: options.consumeRows ?? [], error: null })),
  }
}

describe('desktop-sso.service', () => {
  beforeEach(() => {
    insertedRows.length = 0
    createAdminClientMock.mockReset()
  })

  it('persiste el hash del ticket y nunca su valor en claro', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock())

    const ticket = await issueDesktopSsoTicket({
      codeChallenge: deriveCodeChallenge(VERIFIER),
      userId: 'uuid-1',
    })

    expect(ticket).toMatch(/^[a-f0-9]{64}$/)
    const stored = insertedRows[0]
    expect(stored.token_hash).not.toBe(ticket)
    expect(Object.values(stored)).not.toContain(ticket)
  })

  it('acepta el canje cuando el verificador corresponde al desafio', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        consumeRows: [{ code_challenge: deriveCodeChallenge(VERIFIER), user_id: 'uuid-1' }],
      }),
    )

    await expect(consumeDesktopSsoTicket(TICKET, VERIFIER)).resolves.toEqual({
      ok: true,
      userId: 'uuid-1',
    })
  })

  it('rechaza de forma indistinguible los cuatro fallos de ticket', async () => {
    // Inexistente, expirado y ya consumido son el mismo caso para el llamador:
    // la funcion de consumo no devuelve fila en ninguno de los tres.
    createAdminClientMock.mockReturnValue(createSupabaseMock({ consumeRows: [] }))
    const sinFila = await consumeDesktopSsoTicket(TICKET, VERIFIER)

    // Verificador incorrecto: la fila existe pero el desafio no coincide.
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        consumeRows: [{ code_challenge: deriveCodeChallenge('otro-verificador-distinto'), user_id: 'uuid-1' }],
      }),
    )
    const verificadorMalo = await consumeDesktopSsoTicket(TICKET, VERIFIER)

    expect(sinFila).toEqual({ code: 'invalid_ticket', ok: false })
    expect(verificadorMalo).toEqual(sinFila)
  })

  it('quema el ticket aunque el verificador sea incorrecto', async () => {
    const supabase = createSupabaseMock({
      consumeRows: [{ code_challenge: deriveCodeChallenge('otro'), user_id: 'uuid-1' }],
    })
    createAdminClientMock.mockReturnValue(supabase)

    await consumeDesktopSsoTicket(TICKET, VERIFIER)

    // El consumo ocurre en la consulta, antes de comparar: quien intercepto el
    // ticket no puede seguir probando verificadores con el.
    expect(supabase.rpc).toHaveBeenCalledWith('consume_desktop_sso_ticket', {
      p_token_hash: expect.any(String),
    })
  })

  it('reconoce la ausencia de membresia activa', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({ membershipId: null }))
    await expect(hasActiveMembership('uuid-1')).resolves.toBe(false)

    createAdminClientMock.mockReturnValue(createSupabaseMock({ membershipId: 'membresia-1' }))
    await expect(hasActiveMembership('uuid-1')).resolves.toBe(true)
  })

  it('devuelve solo el hash del enlace magico, nunca el enlace', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({ generateLinkHash: 'hash-abc' }))

    await expect(generateDesktopAccessProof('uuid-1')).resolves.toEqual({ tokenHash: 'hash-abc' })
  })

  it('no emite prueba de acceso si el usuario no tiene correo en Auth', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({ userEmail: null }))

    await expect(generateDesktopAccessProof('uuid-1')).resolves.toBeNull()
  })

  it('deniega el retorno sin emitir ticket cuando no hay membresia activa', async () => {
    const supabase = createSupabaseMock({ membershipId: null })
    createAdminClientMock.mockReturnValue(supabase)

    const url = await buildDesktopHandoffUrl({
      codeChallenge: deriveCodeChallenge(VERIFIER),
      state: STATE,
      userId: 'uuid-1',
    })

    expect(url).toBe(`soflia://auth/callback?state=${STATE}&error=access_denied`)
    expect(insertedRows).toHaveLength(0)
  })

  it('devuelve un codigo al escritorio en vez de lanzar cuando algo falla', async () => {
    createAdminClientMock.mockImplementation(() => {
      throw new Error('base de datos caida')
    })

    const url = await buildDesktopHandoffUrl({
      codeChallenge: deriveCodeChallenge(VERIFIER),
      state: STATE,
      userId: 'uuid-1',
    })

    expect(url).toBe(`soflia://auth/callback?state=${STATE}&error=exchange_unavailable`)
  })

  it('construye el retorno con el ticket cuando todo es valido', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({ membershipId: 'membresia-1' }))

    const url = await buildDesktopHandoffUrl({
      codeChallenge: deriveCodeChallenge(VERIFIER),
      state: STATE,
      userId: 'uuid-1',
    })

    expect(url).toMatch(/^soflia:\/\/auth\/callback\?ticket=[a-f0-9]{64}&state=/)
  })
})
