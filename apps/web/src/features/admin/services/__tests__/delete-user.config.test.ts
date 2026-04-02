import { describe, expect, it } from 'vitest'
import {
  USER_NULL_UPDATE_TABLES,
  USER_SIMPLE_DELETE_TABLES,
} from '../admin-users/delete-user.config'

describe('delete-user.config', () => {
  it('includes critical delete tables only once per table-column pair', () => {
    const keys = USER_SIMPLE_DELETE_TABLES.map(
      (config) => `${config.tableName}:${config.column || 'user_id'}`,
    )

    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain('user_notifications:user_id')
    expect(keys).toContain('calendar_integrations:user_id')
    expect(keys).toContain('organization_users:user_id')
  })

  it('tracks tables that must be nullified instead of deleted', () => {
    const keys = USER_NULL_UPDATE_TABLES.map(
      (config) => `${config.tableName}:${config.column || 'user_id'}`,
    )

    expect(keys).toContain('courses:instructor_id')
    expect(keys).toContain('organization_nodes:manager_id')
    expect(keys).toContain('community_access_requests:reviewed_by')
  })
})
