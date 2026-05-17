import type { Request, Response } from 'express'

export function createRequest(authorization?: string): Request {
  return {
    headers: authorization ? { authorization } : {},
  } as Request
}

export function createResponse(): Response {
  return {} as Response
}
