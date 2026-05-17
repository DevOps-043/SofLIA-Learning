import { z } from 'zod'

import { validateProductionEnv } from './env.production'
import { resolveEnvConfig } from './env.resolve'
import { envSchema } from './env.schema'

export function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env)
    const resolved = resolveEnvConfig(parsed)
    validateProductionEnv(parsed, resolved)
    return resolved
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((validationError) => {
        void validationError
      })
    }

    process.exit(1)
  }
}
