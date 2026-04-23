import { CourseImportError } from './errors'

export async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch (error) {
    console.error('[IMPORT API] JSON Parse Error:', error)
    throw new CourseImportError(400, { error: 'Invalid JSON body' })
  }
}

export function isPingRequest(body: unknown) {
  return Boolean(
    body &&
      typeof body === 'object' &&
      'type' in body &&
      (body as { type?: unknown }).type === 'ping',
  )
}
