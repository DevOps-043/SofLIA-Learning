import type { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminWorkshops } from '../useAdminWorkshops'
import { useAdminReportes } from '../useAdminReportes'

function Wrapper({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>{children}</SWRConfig>
}
function deferred() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>(done => { resolve = done })
  return { promise, resolve }
}
function response(items: string[] = []) {
  return new Response(JSON.stringify({
    success: true,
    workshops: items.map(id => ({ id })), reportes: items.map(id => ({ id })),
    pagination: { page: 1, limit: 24, total: items.length, totalPages: 1 }, stats: { total: 55 },
  }), { status: 200 })
}
const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('directory revalidation', () => {
  it('updates only workshop records, retains stats, and ignores a slower previous search', async () => {
    const older = deferred()
    const latest = deferred()
    fetchMock.mockImplementation(url => {
      const value = String(url)
      if (value.includes('search=older')) return older.promise
      if (value.includes('search=latest')) return latest.promise
      return Promise.resolve(response(['initial']))
    })
    const { result, rerender } = renderHook(({ search }) => useAdminWorkshops({
      page: 1, limit: 24, searchTerm: search, filterCategory: 'all', filterStatus: 'all',
    }), { initialProps: { search: '' }, wrapper: Wrapper })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.workshops[0]?.id).toBe('initial'))
    const stats = result.current.stats
    rerender({ search: 'older' })
    await waitFor(() => expect(result.current.isValidating).toBe(true))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.workshops[0].id).toBe('initial')
    expect(result.current.stats).toBe(stats)
    rerender({ search: 'latest' })
    await act(async () => latest.resolve(response(['latest'])))
    await waitFor(() => expect(result.current.workshops[0]?.id).toBe('latest'))
    await act(async () => older.resolve(response(['older'])))
    expect(result.current.workshops[0].id).toBe('latest')
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/stats'))).toHaveLength(1)
  })

  it('does not revert to initial workshop loading after an empty result or failed filter', async () => {
    const pending = deferred()
    fetchMock.mockImplementation(url => String(url).includes('search=missing') ? pending.promise : Promise.resolve(response()))
    const { result, rerender } = renderHook(({ search }) => useAdminWorkshops({
      page: 1, limit: 24, searchTerm: search, filterCategory: 'all', filterStatus: 'all',
    }), { initialProps: { search: '' }, wrapper: Wrapper })
    await waitFor(() => expect(result.current.hasLoadedData).toBe(true))
    rerender({ search: 'missing' })
    expect(result.current.isLoading).toBe(false)
    await act(async () => pending.resolve(new Response('{}', { status: 500 })))
    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.hasLoadedData).toBe(true)
    expect(result.current.workshops).toEqual([])
  })

  it('preserves report records while applying filters and ignores older responses', async () => {
    const older = deferred()
    const latest = deferred()
    fetchMock.mockImplementation(url => {
      const value = String(url)
      if (value.includes('search=older')) return older.promise
      if (value.includes('search=latest')) return latest.promise
      return Promise.resolve(response(['initial']))
    })
    const { result } = renderHook(() => useAdminReportes(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.reportes[0]?.id).toBe('initial'))
    act(() => result.current.applyFilters({ search: 'older' }))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isValidating).toBe(true)
    expect(result.current.reportes[0].id).toBe('initial')
    act(() => result.current.applyFilters({ search: 'latest' }))
    await act(async () => latest.resolve(response(['latest'])))
    await waitFor(() => expect(result.current.reportes[0]?.id).toBe('latest'))
    await act(async () => older.resolve(response(['older'])))
    expect(result.current.reportes[0].id).toBe('latest')
  })

  it('retains an empty report result on filter errors and retries without initial loading', async () => {
    fetchMock.mockResolvedValueOnce(response()).mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: 'load_failed' }), { status: 500 })).mockResolvedValueOnce(response(['recovered']))
    const { result } = renderHook(() => useAdminReportes(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.hasLoadedData).toBe(true))
    act(() => result.current.applyFilters({ search: 'failed' }))
    await waitFor(() => expect(result.current.error).toBe('load_failed'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasLoadedData).toBe(true)
    expect(result.current.reportes).toEqual([])
    await act(async () => { await result.current.refetch() })
    expect(result.current.error).toBeNull()
    expect(result.current.reportes[0]?.id).toBe('recovered')
  })
})
