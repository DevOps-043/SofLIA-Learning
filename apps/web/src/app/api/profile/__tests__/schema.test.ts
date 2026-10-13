import { describe, expect, it } from 'vitest'
import { updateProfileSchema } from '../schema'

describe('self-service profile schema', () => {
  it.each(['platform_role', 'is_banned', 'email_verified', 'last_login_at', 'last_activity_at'])
    ('rejects server-owned field %s', field => {
      expect(updateProfileSchema.safeParse({ first_name: 'Ada', [field]: 'modified' }).success).toBe(false)
    })
  it('accepts personal and employment profile fields', () => {
    expect(updateProfileSchema.safeParse({ first_name: 'Ada', job_title: 'Engineer' }).success).toBe(true)
  })
})
