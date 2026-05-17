import { z } from 'zod'
import { appContentFields } from './app-content-fields.schema'
import { appIdentityFields } from './app-identity-fields.schema'
import { appPlatformFields } from './app-platform-fields.schema'
import { appPricingFields } from './app-pricing-fields.schema'

export const CreateAppSchema = z.object({
  ...appIdentityFields,
  ...appPricingFields,
  ...appContentFields,
  ...appPlatformFields,
})

export const UpdateAppSchema = CreateAppSchema.partial()

export type CreateAppInput = z.infer<typeof CreateAppSchema>
export type UpdateAppInput = z.infer<typeof UpdateAppSchema>
