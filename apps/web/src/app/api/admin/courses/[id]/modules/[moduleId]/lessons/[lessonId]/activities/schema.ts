import { z } from 'zod'

// Schema permisivo a nivel JSON; la forma completa se valida en
// `validateCreateActivityPayload` / `validateUpdateActivityPayload`
// porque depende del `activity_type` y de payloads polimórficos.
export const activityBodySchema = z.record(z.unknown())

export type ActivityBody = z.infer<typeof activityBodySchema>
