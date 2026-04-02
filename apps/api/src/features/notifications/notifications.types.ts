import { z } from 'zod'

import type { Json } from '@/core/supabase/database.types'
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

export interface Notification {
  notification_id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Json
  priority: NotificationPriority
  status: NotificationStatus
  channels_sent: Json
  channels_pending: Json
  read_at: string | null
  expires_at: string | null
  organization_id: string | null
  group_id: string | null
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  status?: NotificationStatus
  notificationType?: string
  priority?: NotificationPriority
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'priority' | 'status'
  orderDirection?: 'asc' | 'desc'
}

export interface NormalizedNotificationFilters {
  status?: NotificationStatus
  notificationType?: string
  priority?: NotificationPriority
  limit: number
  offset: number
  orderBy: 'created_at' | 'priority' | 'status'
  orderDirection: 'asc' | 'desc'
}

export interface NotificationInsertPayload {
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Json
  priority: NotificationPriority
  status: 'unread'
  channels_sent: Json
  channels_pending: Json
  organization_id: string | null
  group_id: string | null
}

export interface NotificationPatch {
  status?: NotificationStatus
  read_at?: string | null
  updated_at?: string
}

export interface UnreadNotificationCounts {
  total: number
  critical: number
  high: number
}
