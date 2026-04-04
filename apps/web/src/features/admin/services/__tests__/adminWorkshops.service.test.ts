import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('../../../lib/slug', () => ({
  sanitizeSlug: vi.fn((s: string) => s.toLowerCase().replace(/\s+/g, '-')),
  generateUniqueSlugAsync: vi.fn((s: string) => Promise.resolve(s.toLowerCase().replace(/\s+/g, '-'))),
}))

vi.mock('../auditLog.service', () => ({
  AuditLogService: { log: vi.fn().mockResolvedValue(undefined) },
}))

import { createClient } from '@/lib/supabase/server'
import { AdminWorkshopsService } from '../adminWorkshops.service'

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Creates a thenable fluent chain that resolves to `result` when awaited. */
function makeChain(result: unknown): Record<string, unknown> & PromiseLike<unknown> {
  const methods = ['from','select','eq','neq','in','not','or','order','insert','update','delete','single','limit','range','head']
  const chain = {} as Record<string, unknown> & PromiseLike<unknown>
  for (const m of methods) chain[m] = vi.fn(() => chain)
  chain.then = (onfulfilled?: ((v: unknown) => unknown) | null) => Promise.resolve(result).then(onfulfilled)
  chain.catch = (onrej?: ((r: unknown) => unknown) | null) => Promise.resolve(result).catch(onrej)
  return chain
}

function makeSupabase(result: unknown) {
  // Top-level supabase object: NOT thenable (so `await createClient()` works correctly)
  const sb: Record<string, unknown> = {}
  // from() returns a thenable chain
  sb.from = vi.fn(() => makeChain(result))
  vi.mocked(createClient).mockResolvedValue(sb as never)
  return sb
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getAllWorkshops ──────────────────────────────────────────────────────────

describe('AdminWorkshopsService.getAllWorkshops', () => {
  it('returns empty array when no workshops exist', async () => {
    makeSupabase({ data: [], error: null })

    const result = await AdminWorkshopsService.getAllWorkshops()
    expect(result).toEqual([])
  })

  it('throws when supabase returns a database error', async () => {
    makeSupabase({ data: null, error: { message: 'DB error' } })

    await expect(AdminWorkshopsService.getAllWorkshops()).rejects.toBeDefined()
  })
})

// ─── getInstructors ──────────────────────────────────────────────────────────

describe('AdminWorkshopsService.getInstructors', () => {
  it('returns mapped instructor list', async () => {
    const mockInstructors = [
      { id: 'ins-1', first_name: 'Ana', last_name: 'García', display_name: null },
      { id: 'ins-2', first_name: null, last_name: null, display_name: 'Juan López' },
    ]
    makeSupabase({ data: mockInstructors, error: null })

    const result = await AdminWorkshopsService.getInstructors()

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)
    expect(result[0]).toEqual({ id: 'ins-1', name: 'Ana García' })
    expect(result[1]).toEqual({ id: 'ins-2', name: 'Juan López' })
  })

  it('throws when supabase errors', async () => {
    makeSupabase({ data: null, error: { message: 'fail' } })

    await expect(AdminWorkshopsService.getInstructors()).rejects.toBeDefined()
  })

  it('uses fallback name when display_name and names are null', async () => {
    const mockInstructors = [
      { id: 'ins-3', first_name: null, last_name: null, display_name: null },
    ]
    makeSupabase({ data: mockInstructors, error: null })

    const result = await AdminWorkshopsService.getInstructors()
    expect(result[0].name).toBe('Instructor sin nombre')
  })
})

// ─── getWorkshopStats ────────────────────────────────────────────────────────

describe('AdminWorkshopsService.getWorkshopStats', () => {
  it('returns stats object with numeric fields', async () => {
    makeSupabase({ count: 0, data: [], error: null })

    const result = await AdminWorkshopsService.getWorkshopStats()

    expect(typeof result.totalWorkshops).toBe('number')
    expect(typeof result.activeWorkshops).toBe('number')
    expect(typeof result.totalStudents).toBe('number')
    expect(typeof result.averageDuration).toBe('number')
    expect(typeof result.totalInstructors).toBe('number')
  })
})
