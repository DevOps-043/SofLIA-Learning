import { NextResponse } from 'next/server'

export async function readCourseImportBody(
  request: Request
): Promise<
  | { body: Record<string, unknown>; success: true }
  | { response: NextResponse; success: false }
> {
  try {
    return { body: await request.json(), success: true }
  } catch (error) {
    console.error('[IMPORT API] JSON Parse Error:', error)
    return {
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
      success: false,
    }
  }
}
