import { CourseImportError } from './errors'

export function validateCourseForgeApiKey(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.COURSEFORGE_API_KEY

  if (!validApiKey || apiKey !== validApiKey) {
    console.warn('[IMPORT API] Unauthorized - API key mismatch')
    throw new CourseImportError(401, {
      error: 'Unauthorized: Invalid or missing API Key',
    })
  }
}
