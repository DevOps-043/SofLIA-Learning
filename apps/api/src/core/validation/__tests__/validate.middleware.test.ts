import type { Request, Response } from 'express'
import { z } from 'zod'
import { describe, expect, it, vi } from 'vitest'

import { validateRequest } from '../validate.middleware'

function createResponse(): Response {
  return {} as Response
}

describe('validateRequest', () => {
  it('coerces and assigns validated request segments', () => {
    const middleware = validateRequest({
      query: z.object({
        limit: z.coerce.number().int().min(1),
      }),
      params: z.object({
        notificationId: z.string().trim().min(1),
      }),
    })
    const next = vi.fn()
    const request = {
      query: { limit: '5' },
      params: { notificationId: 'notif-1' },
    } as unknown as Request

    middleware(request, createResponse(), next)

    expect(request.query).toEqual({ limit: 5 })
    expect(request.params).toEqual({ notificationId: 'notif-1' })
    expect(next).toHaveBeenCalledWith()
  })

  it('forwards zod validation errors', () => {
    const middleware = validateRequest({
      body: z.object({
        title: z.string().min(3),
      }),
    })
    const next = vi.fn()
    const request = {
      body: { title: 'no' },
    } as unknown as Request

    middleware(request, createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'title',
          }),
        ]),
      }),
    )
  })
})
