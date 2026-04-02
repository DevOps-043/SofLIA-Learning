import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminWorkshopsPageLogic } from '../useAdminWorkshopsPageLogic'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('../useAdminWorkshops', () => ({
  useAdminWorkshops: vi.fn(),
}))

vi.mock('../../components/admin-workshops/admin-workshops-display.service', () => ({
  filterAdminWorkshops: vi.fn((workshops: unknown[]) => workshops),
  updateAdminWorkshop: vi.fn(),
  deleteAdminWorkshop: vi.fn(),
}))

import { useAdminWorkshops } from '../useAdminWorkshops'
import {
  deleteAdminWorkshop,
  updateAdminWorkshop,
} from '../../components/admin-workshops/admin-workshops-display.service'
import { useRouter } from 'next/navigation'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeWorkshop(overrides = {}) {
  return {
    id: 'workshop-1',
    title: 'Test Workshop',
    description: 'Description',
    category: 'tech',
    status: 'active',
    instructor: 'Instructor Name',
    duration: 60,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeUseAdminWorkshopsResult(overrides = {}) {
  return {
    workshops: [],
    stats: { total: 0, active: 0, inactive: 0 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAdminWorkshops).mockReturnValue(makeUseAdminWorkshopsResult())
})

// ─── initial state ────────────────────────────────────────────────────────────

describe('useAdminWorkshopsPageLogic — initial state', () => {
  it('returns default filter values', () => {
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    expect(result.current.searchTerm).toBe('')
    expect(result.current.filterCategory).toBe('all')
    expect(result.current.filterStatus).toBe('all')
  })

  it('returns closed modal state by default', () => {
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    expect(result.current.isAddModalOpen).toBe(false)
    expect(result.current.editingWorkshop).toBeNull()
    expect(result.current.workshopToDelete).toBeNull()
  })

  it('reflects loading state from useAdminWorkshops', () => {
    vi.mocked(useAdminWorkshops).mockReturnValue(makeUseAdminWorkshopsResult({ isLoading: true }))

    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    expect(result.current.isLoading).toBe(true)
  })

  it('returns workshops from useAdminWorkshops', () => {
    const workshops = [makeWorkshop()]
    vi.mocked(useAdminWorkshops).mockReturnValue(makeUseAdminWorkshopsResult({ workshops }))

    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    expect(result.current.workshops).toEqual(workshops)
  })
})

// ─── add modal ────────────────────────────────────────────────────────────────

describe('openAddModal / closeAddModal', () => {
  it('sets isAddModalOpen to true on openAddModal', () => {
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openAddModal())

    expect(result.current.isAddModalOpen).toBe(true)
  })

  it('sets isAddModalOpen to false on closeAddModal', () => {
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openAddModal())
    act(() => result.current.closeAddModal())

    expect(result.current.isAddModalOpen).toBe(false)
  })
})

// ─── edit modal ───────────────────────────────────────────────────────────────

describe('openEditModal / closeEditModal', () => {
  it('sets editingWorkshop on openEditModal', () => {
    const workshop = makeWorkshop()
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openEditModal(workshop))

    expect(result.current.editingWorkshop).toEqual(workshop)
  })

  it('clears editingWorkshop on closeEditModal', () => {
    const workshop = makeWorkshop()
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openEditModal(workshop))
    act(() => result.current.closeEditModal())

    expect(result.current.editingWorkshop).toBeNull()
  })
})

// ─── delete modal ─────────────────────────────────────────────────────────────

describe('openDeleteModal / closeDeleteModal', () => {
  it('sets workshopToDelete on openDeleteModal', () => {
    const workshop = makeWorkshop()
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openDeleteModal(workshop))

    expect(result.current.workshopToDelete).toEqual(workshop)
  })

  it('clears workshopToDelete on closeDeleteModal', () => {
    const workshop = makeWorkshop()
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openDeleteModal(workshop))
    act(() => result.current.closeDeleteModal())

    expect(result.current.workshopToDelete).toBeNull()
  })
})

// ─── handleViewWorkshop ───────────────────────────────────────────────────────

describe('handleViewWorkshop', () => {
  it('navigates to admin workshop detail page', () => {
    const pushMock = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as ReturnType<typeof useRouter>)
    const workshop = makeWorkshop({ id: 'workshop-42' })
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.handleViewWorkshop(workshop))

    expect(pushMock).toHaveBeenCalledWith('/admin/workshops/workshop-42')
  })
})

// ─── handleWorkshopCreated ────────────────────────────────────────────────────

describe('handleWorkshopCreated', () => {
  it('calls refetch and closes the add modal', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAdminWorkshops).mockReturnValue(makeUseAdminWorkshopsResult({ refetch }))
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openAddModal())
    await act(() => result.current.handleWorkshopCreated())

    expect(refetch).toHaveBeenCalledOnce()
    expect(result.current.isAddModalOpen).toBe(false)
  })
})

// ─── handleWorkshopUpdated ────────────────────────────────────────────────────

describe('handleWorkshopUpdated', () => {
  it('calls updateAdminWorkshop, refetch, and closes edit modal', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAdminWorkshops).mockReturnValue(makeUseAdminWorkshopsResult({ refetch }))
    vi.mocked(updateAdminWorkshop).mockResolvedValue(undefined)
    const workshop = makeWorkshop()
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openEditModal(workshop))
    await act(() => result.current.handleWorkshopUpdated({ title: 'Updated' }))

    expect(updateAdminWorkshop).toHaveBeenCalledWith('workshop-1', { title: 'Updated' })
    expect(refetch).toHaveBeenCalledOnce()
    expect(result.current.editingWorkshop).toBeNull()
  })

  it('does nothing when editingWorkshop is null', async () => {
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    await act(() => result.current.handleWorkshopUpdated({ title: 'Updated' }))

    expect(updateAdminWorkshop).not.toHaveBeenCalled()
  })
})

// ─── handleWorkshopDeleted ────────────────────────────────────────────────────

describe('handleWorkshopDeleted', () => {
  it('calls deleteAdminWorkshop, refetch, and closes delete modal', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAdminWorkshops).mockReturnValue(makeUseAdminWorkshopsResult({ refetch }))
    vi.mocked(deleteAdminWorkshop).mockResolvedValue(undefined)
    const workshop = makeWorkshop()
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    act(() => result.current.openDeleteModal(workshop))
    await act(() => result.current.handleWorkshopDeleted())

    expect(deleteAdminWorkshop).toHaveBeenCalledWith('workshop-1')
    expect(refetch).toHaveBeenCalledOnce()
    expect(result.current.workshopToDelete).toBeNull()
  })

  it('does nothing when workshopToDelete is null', async () => {
    const { result } = renderHook(() => useAdminWorkshopsPageLogic())

    await act(() => result.current.handleWorkshopDeleted())

    expect(deleteAdminWorkshop).not.toHaveBeenCalled()
  })
})
