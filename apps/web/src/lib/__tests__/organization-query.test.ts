import { describe, expect, it, vi } from 'vitest'
import {
  buildOrganizationCondition,
  extractOrganizationId,
  isValidOrganizationId,
  withOrganizationData,
  withOrganizationFilter,
} from '../utils/organization-query'

const validOrganizationId = '123e4567-e89b-12d3-a456-426614174000'

describe('withOrganizationFilter', () => {
  it('applies eq when organization id is present', () => {
    const eq = vi.fn()
    const is = vi.fn()
    const query = {
      eq,
      is,
    }

    withOrganizationFilter(query, validOrganizationId)

    expect(eq).toHaveBeenCalledWith('organization_id', validOrganizationId)
    expect(is).not.toHaveBeenCalled()
  })

  it('applies is null when organization id is null', () => {
    const eq = vi.fn()
    const is = vi.fn()
    const query = {
      eq,
      is,
    }

    withOrganizationFilter(query, null)

    expect(is).toHaveBeenCalledWith('organization_id', null)
    expect(eq).not.toHaveBeenCalled()
  })
})

describe('buildOrganizationCondition', () => {
  it('builds a direct organization filter for B2B users', () => {
    expect(buildOrganizationCondition(validOrganizationId)).toBe(
      `organization_id = '${validOrganizationId}'`,
    )
  })

  it('builds an IS NULL filter for B2C users', () => {
    expect(buildOrganizationCondition(null)).toBe('organization_id IS NULL')
  })
})

describe('withOrganizationData', () => {
  it('returns the organization scoped payload', () => {
    expect(withOrganizationData(validOrganizationId)).toEqual({
      organization_id: validOrganizationId,
    })
  })
})

describe('isValidOrganizationId', () => {
  it('accepts valid UUIDs', () => {
    expect(isValidOrganizationId(validOrganizationId)).toBe(true)
  })

  it('rejects invalid UUIDs', () => {
    expect(isValidOrganizationId('not-a-uuid')).toBe(false)
    expect(isValidOrganizationId(123)).toBe(false)
  })
})

describe('extractOrganizationId', () => {
  it('prioritizes the explicit organization id', () => {
    const request = new Request('https://example.com/dashboard?organizationId=00000000-0000-0000-0000-000000000000')
    expect(extractOrganizationId(request, validOrganizationId)).toBe(validOrganizationId)
  })

  it('falls back to the request header', () => {
    const request = new Request('https://example.com/dashboard', {
      headers: {
        'X-Organization-ID': validOrganizationId,
      },
    })

    expect(extractOrganizationId(request)).toBe(validOrganizationId)
  })

  it('falls back to the query string when needed', () => {
    const request = new Request(`https://example.com/dashboard?org_id=${validOrganizationId}`)
    expect(extractOrganizationId(request)).toBe(validOrganizationId)
  })

  it('returns null for invalid organization ids', () => {
    const request = new Request('https://example.com/dashboard?organizationId=invalid-id', {
      headers: {
        'X-Organization-ID': 'also-invalid',
      },
    })

    expect(extractOrganizationId(request)).toBeNull()
  })
})
