import { z } from 'zod'

import {
  nonEmptyStringSchema,
  paginationQuerySchema,
  sortDirectionSchema,
} from '@/core/validation/common.schemas'

export const notificationPrioritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
])
export const notificationStatusSchema = z.enum(['unread', 'read', 'archived'])
export const notificationOrderBySchema = z.enum([
  'created_at',
  'priority',
  'status',
])

export const notificationIdParamsSchema = z.object({
  notificationId: nonEmptyStringSchema,
})

export const notificationListQuerySchema = paginationQuerySchema
  .extend({
    status: notificationStatusSchema.optional(),
    type: nonEmptyStringSchema.optional(),
    notificationType: nonEmptyStringSchema.optional(),
    priority: notificationPrioritySchema.optional(),
    orderBy: notificationOrderBySchema.default('created_at'),
    orderDirection: sortDirectionSchema.default('desc'),
  })
  .transform(({ type, notificationType, ...rest }) => ({
    ...rest,
    notificationType: notificationType ?? type,
  }))

export const createNotificationBodySchema = z.object({
  userId: nonEmptyStringSchema,
  notificationType: nonEmptyStringSchema,
  title: nonEmptyStringSchema.max(200),
  message: nonEmptyStringSchema.max(2000),
  metadata: z.record(z.unknown()).optional(),
  priority: notificationPrioritySchema.optional(),
  organizationId: nonEmptyStringSchema.optional(),
  groupId: nonEmptyStringSchema.optional(),
})

export type NotificationPriority = z.infer<typeof notificationPrioritySchema>
export type NotificationStatus = z.infer<typeof notificationStatusSchema>
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
export type CreateNotificationInput = z.infer<typeof createNotificationBodySchema>
