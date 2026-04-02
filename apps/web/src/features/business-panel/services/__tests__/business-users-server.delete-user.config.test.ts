import { describe, expect, it } from 'vitest'
import {
  BUSINESS_USER_SIMPLE_DELETE_BATCHES,
  isIgnorableDeleteErrorCode,
} from '../business-users-server/delete-user.config'

describe('business-users-server.delete-user.config', () => {
  it('keeps critical security and planner cleanup targets in the cascade plan', () => {
    const targets = BUSINESS_USER_SIMPLE_DELETE_BATCHES.flatMap((batch) =>
      batch.map((target) => `${target.tableName}:${target.column ?? 'user_id'}`),
    )

    expect(targets).toContain('refresh_tokens:user_id')
    expect(targets).toContain('oauth_accounts:user_id')
    expect(targets).toContain('calendar_integrations:user_id')
    expect(targets).toContain('organization_course_assignments:assigned_by')
    expect(targets).toContain('work_team_feedback:from_user_id')
  })

  it('marks only known missing-table codes as ignorable', () => {
    expect(isIgnorableDeleteErrorCode('42P01')).toBe(true)
    expect(isIgnorableDeleteErrorCode('PGRST116')).toBe(true)
    expect(isIgnorableDeleteErrorCode('23505')).toBe(false)
    expect(isIgnorableDeleteErrorCode(undefined)).toBe(false)
  })
})
