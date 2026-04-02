import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'

import { fromZodError } from '@/core/errors/app-error'

interface ValidationSchemas {
  body?: ZodTypeAny
  params?: ZodTypeAny
  query?: ZodTypeAny
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const [segment, schema] of Object.entries(schemas) as Array<
      [keyof ValidationSchemas, ZodTypeAny | undefined]
    >) {
      if (!schema) {
        continue
      }

      const result = schema.safeParse(req[segment] ?? {})
      if (!result.success) {
        next(fromZodError(result.error))
        return
      }

      req[segment] = result.data
    }

    next()
  }
}
