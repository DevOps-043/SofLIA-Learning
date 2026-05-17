import type { Request } from 'express'

export function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    query: {},
    ...overrides,
  } as Request
}
