import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBusinessAssignCourseModal } from '../useBusinessAssignCourseModal'

vi.mock('../../../hooks/useBusinessUsers', () => ({ useBusinessUsers: () => ({
  users: [{ id: 'diana', display_name: 'Diana Coto', email: 'diana@example.com', org_status: 'active' }, { id: 'israel', display_name: 'Israel', email: 'israel@example.com', org_status: 'active' }],
  isLoading: false, syncOrgData: vi.fn(),
}) }))

const fetchMock = vi.fn()
const onClose = vi.fn()
const onAssignComplete = vi.fn()
const params = {
  isOpen: true, orgSlug: 'pulsehub', courseId: 'challenger', courseTitle: 'Método Challenger', onClose, onAssignComplete,
  t: ((key: string) => key) as never,
}
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })
const assigned = (userIds: string[]) => ({ success: true, user_ids: userIds, assigned_users: userIds.map(user_id => ({ user_id, source: 'direct' })) })

beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => vi.unstubAllGlobals())

describe('assignment modal state', () => {
  it('marks Diana as directly assigned, excludes her from new assignments, and allows removal', async () => {
    fetchMock.mockImplementation((url: string, options?: RequestInit) => Promise.resolve(
      options?.method === 'DELETE' ? response({ success: true })
        : url.endsWith('/assigned-users') ? response(assigned(['israel', 'diana']))
          : response({ hierarchyNodes: [] }),
    ))
    const { result } = renderHook(() => useBusinessAssignCourseModal(params))
    await waitFor(() => expect(result.current.assignmentsReady).toBe(true))
    expect(result.current.alreadyAssignedUserIds.has('diana')).toBe(true)
    expect(result.current.assignedUserSources.get('diana')?.source).toBe('direct')
    expect(result.current.availableUserCount).toBe(0)
    act(() => result.current.handleToggleUser('diana'))
    expect(result.current.selectedUserIds.has('diana')).toBe(false)
    act(() => result.current.handleToggleRemoval('diana'))
    expect(result.current.pendingRemovalIds.has('diana')).toBe(true)
    await act(async () => result.current.handleAssign())
    expect(fetchMock).toHaveBeenCalledWith('/api/pulsehub/business/courses/challenger/assign', expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ user_ids: ['diana'] }) }))
    expect(onAssignComplete).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('refreshes badges after a concurrent assignment and displays the human API message', async () => {
    let reads = 0
    fetchMock.mockImplementation((url: string, options?: RequestInit) => Promise.resolve(
      options?.method === 'POST' ? response({ error: 'COURSE_ALREADY_ASSIGNED', message: 'Este curso ya está asignado. Usa Clic para quitar.' }, 400)
        : url.endsWith('/assigned-users') ? response(assigned(++reads === 1 ? ['israel'] : ['israel', 'diana']))
          : response({ hierarchyNodes: [] }),
    ))
    const { result } = renderHook(() => useBusinessAssignCourseModal(params))
    await waitFor(() => expect(result.current.assignmentsReady).toBe(true))
    act(() => result.current.handleToggleUser('diana'))
    await act(async () => result.current.handleAssign())
    await waitFor(() => expect(result.current.alreadyAssignedUserIds.has('diana')).toBe(true))
    expect(result.current.error).toBe('Este curso ya está asignado. Usa Clic para quitar.')
    expect(result.current.error).not.toContain('COURSE_ALREADY_ASSIGNED')
    expect(result.current.selectedUserIds.size).toBe(0)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks assignment while the assignment list is unavailable', async () => {
    fetchMock.mockImplementation((url: string) => Promise.resolve(url.endsWith('/assigned-users') ? response({}, 500) : response({ hierarchyNodes: [] })))
    const { result } = renderHook(() => useBusinessAssignCourseModal(params))
    await waitFor(() => expect(result.current.loadingAssignments).toBe(false))
    expect(result.current.assignmentsReady).toBe(false)
    expect(result.current.error).toContain('No se pudieron consultar las asignaciones')
    act(() => result.current.handleToggleUser('diana'))
    await act(async () => result.current.handleAssign())
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false)
  })
})
