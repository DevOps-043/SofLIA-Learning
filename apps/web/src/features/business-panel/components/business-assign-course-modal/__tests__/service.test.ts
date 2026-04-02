import { describe, expect, it } from 'vitest'
import {
  areAllUsersSelected,
  buildBusinessAssignCoursePayload,
  filterBusinessAssignableUsers,
  getDateInputValue,
  getBusinessAssignCourseDisplayName,
  normalizeLiaSuggestedDate,
  toggleSelectedUserId,
} from '../service'

describe('business-assign-course-modal.service', () => {
  it('resuelve display name con fallbacks', () => {
    expect(
      getBusinessAssignCourseDisplayName({
        id: '1',
        username: 'ada',
        display_name: null,
        first_name: 'Ada',
        last_name: 'Lovelace',
      } as never),
    ).toBe('Ada Lovelace')
  })

  it('filtra solo usuarios activos y matchea por nombre o email', () => {
    const result = filterBusinessAssignableUsers(
      [
        {
          id: '1',
          username: 'ada',
          email: 'ada@test.com',
          display_name: 'Ada Lovelace',
          org_status: 'active',
        },
        {
          id: '2',
          username: 'grace',
          email: 'grace@test.com',
          display_name: 'Grace Hopper',
          org_status: 'suspended',
        },
      ] as never,
      'ada',
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('alterna usuarios seleccionados y detecta selección total', () => {
    const selected = toggleSelectedUserId(new Set<string>(), 'user-1')

    expect(selected.has('user-1')).toBe(true)
    expect(areAllUsersSelected(['user-1', 'user-2'], new Set(['user-1']))).toBe(false)
    expect(areAllUsersSelected(['user-1'], selected)).toBe(true)
  })

  it('normaliza payload y sugerencia de LIA', () => {
    expect(
      buildBusinessAssignCoursePayload({
        selectedUserIds: new Set(['user-1', 'user-2']),
        dueDate: '2026-04-10T23:59:59.999Z',
      }),
    ).toMatchObject({
      user_ids: ['user-1', 'user-2'],
      due_date: '2026-04-10T23:59:59.999Z',
      start_date: null,
      approach: null,
      message: null,
    })

    const suggestedDate = normalizeLiaSuggestedDate('2026-04-10')
    expect(suggestedDate).toBeTruthy()
    expect(getDateInputValue(suggestedDate || '')).toBe('2026-04-10')
    expect(normalizeLiaSuggestedDate('invalid-date')).toBeNull()
  })
})
