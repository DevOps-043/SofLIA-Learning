import { describe, expect, it } from 'vitest'
import {
  createNotificationBodySchema,
  notificationListQuerySchema,
} from '../notification/api.schemas'

describe('notification api schemas', () => {
  it('normalizes valid list query params', () => {
    const result = notificationListQuerySchema.safeParse({
      status: 'unread',
      type: 'system_login_success',
      limit: '25',
      offset: '10',
      orderBy: 'created_at',
      orderDirection: 'desc',
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    expect(result.data).toEqual({
      status: 'unread',
      notificationType: 'system_login_success',
      priority: undefined,
      limit: 25,
      offset: 10,
      cursor: undefined,
      orderBy: 'created_at',
      orderDirection: 'desc',
    })
  })

  it('rejects invalid list query params before service execution', () => {
    const result = notificationListQuerySchema.safeParse({
      status: 'deleted',
      priority: 'urgent',
      limit: '500',
      offset: '-1',
      orderBy: 'unknown_column',
      orderDirection: 'sideways',
      cursor: 'not-a-valid-cursor',
    })

    expect(result.success).toBe(false)
  })

  it('validates create notification body fields', () => {
    const result = createNotificationBodySchema.safeParse({
      userId: '8a81f79a-4dc5-4d33-8b5b-8fd7354d4705',
      notificationType: 'course_completed',
      title: 'Curso completado',
      message: 'Has completado el curso.',
      priority: 'medium',
      organizationId: '148291f8-fbe9-4d41-8d5d-e5a621aaf011',
    })

    expect(result.success).toBe(true)
  })
})
