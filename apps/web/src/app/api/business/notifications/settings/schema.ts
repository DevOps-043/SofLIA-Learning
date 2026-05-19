import { z } from 'zod'

const notificationSettingSchema = z.object({
  event_type: z.string().trim().max(120).optional(),
  enabled: z.boolean().optional(),
  channels: z.array(z.string().trim().max(80)).max(20).optional(),
  template: z.unknown().optional(),
})

export const notificationSettingsUpdateSchema = z.object({
  settings: z.array(notificationSettingSchema).max(100),
})

export type NotificationSettingsUpdateBody = z.infer<
  typeof notificationSettingsUpdateSchema
>
