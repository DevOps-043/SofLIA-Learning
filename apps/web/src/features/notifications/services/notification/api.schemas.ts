import { z } from 'zod'
import { parseNotificationCursor } from './utils'

const optionalNonEmptyString = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .optional()

const optionalUuid = z.string().uuid().optional()

const notificationPrioritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
])

const notificationStatusSchema = z.enum(['unread', 'read', 'archived'])

const notificationOrderBySchema = z.enum(['created_at', 'priority', 'status'])

const notificationOrderDirectionSchema = z.enum(['asc', 'desc'])

const boundedIntegerFromQuerySchema = (defaultValue: number, maxValue: number) =>
  z
    .string()
    .optional()
    .default(String(defaultValue))
    .transform((value, context) => {
      if (!/^\d+$/.test(value)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe ser un entero positivo',
        })
        return z.NEVER
      }

      return Number(value)
    })
    .pipe(z.number().int().min(0).max(maxValue))

export const notificationListQuerySchema = z
  .object({
    status: notificationStatusSchema.optional(),
    type: optionalNonEmptyString,
    notificationType: optionalNonEmptyString,
    priority: notificationPrioritySchema.optional(),
    limit: boundedIntegerFromQuerySchema(50, 100).refine(
      (value) => value > 0,
      'Debe ser mayor que 0',
    ),
    offset: boundedIntegerFromQuerySchema(0, 100000),
    cursor: z
      .string()
      .trim()
      .optional()
      .refine((cursor) => !cursor || Boolean(parseNotificationCursor(cursor)), {
        message: 'cursor invalido',
      }),
    orderBy: notificationOrderBySchema.optional().default('created_at'),
    orderDirection: notificationOrderDirectionSchema.optional().default('desc'),
  })
  .transform(({ type, notificationType, ...rest }) => ({
    ...rest,
    notificationType: notificationType ?? type,
  }))

export const createNotificationBodySchema = z.object({
  userId: z.string().uuid(),
  notificationType: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  metadata: z.record(z.unknown()).optional(),
  priority: notificationPrioritySchema.optional(),
  organizationId: optionalUuid,
  groupId: optionalUuid,
})

export type NotificationListQueryInput = z.infer<
  typeof notificationListQuerySchema
>

export type CreateNotificationBodyInput = z.infer<
  typeof createNotificationBodySchema
>
