import type { NextRequest } from 'next/server'
import { handleTranslateExistingLessonsRequest } from './translate-existing-lessons'

export async function POST(request: NextRequest) {
  return handleTranslateExistingLessonsRequest(request)
}
