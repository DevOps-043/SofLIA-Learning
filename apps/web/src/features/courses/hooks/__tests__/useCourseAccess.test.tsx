import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCourseAccess } from '../useCourseAccess'

vi.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'diana' }, loading: false }) }))
vi.mock('@/core/stores/organizationStore', () => ({ useOrganizationStore: (select: (state: unknown) => unknown) => select({ currentOrganization: null }) }))

const fetchMock = vi.fn()
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => vi.unstubAllGlobals())

describe('course access when switching organizations', () => {
  it('ignores a delayed denial from the previous organization', async () => {
    let resolveOld: (response: Response) => void = () => {}
    fetchMock.mockImplementationOnce(() => new Promise<Response>(resolve => { resolveOld = resolve }))
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ isPurchased: true })))
    const { result, rerender } = renderHook(({ org }) => useCourseAccess('Challenger-sale', org), { initialProps: { org: 'soflia' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal
    rerender({ org: 'pulsehub' })
    await waitFor(() => expect(result.current.hasAccess).toBe(true))
    expect(oldSignal.aborted).toBe(true)
    await act(async () => { resolveOld(new Response(JSON.stringify({ isPurchased: false }))) })
    expect(result.current.hasAccess).toBe(true)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/courses/Challenger-sale/check-purchase?orgId=pulsehub', expect.objectContaining({ cache: 'no-store', credentials: 'include' }))
  })

  it('clears the old denial while the new organization is being checked', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ isPurchased: false })))
    fetchMock.mockImplementationOnce(() => new Promise(() => {}))
    const { result, rerender } = renderHook(({ org }) => useCourseAccess('Challenger-sale', org), { initialProps: { org: 'soflia' } })
    await waitFor(() => expect(result.current.hasAccess).toBe(false))
    rerender({ org: 'pulsehub' })
    expect(result.current).toEqual({ hasAccess: null, isLoading: true, error: null })
  })

  it('waits for the route organization to be ready before checking access', () => {
    const { result } = renderHook(() => useCourseAccess('Challenger-sale', null, false))
    expect(result.current.hasAccess).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
