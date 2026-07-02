import 'server-only'

import { StatusComponentKey } from '@aprende-y-aplica/shared'

import { checkAuthStatus } from './auth.checker'
import { checkDatabaseStatus } from './database.checker'
import { checkGeminiStatus } from './gemini.checker'
import type { StatusChecker } from './types'

export type { StatusCheckResult, StatusChecker } from './types'

// Single source of truth for "what does checking component X mean" — used
// identically by the cron pipeline and the admin manual-trigger route.
export const STATUS_CHECKERS: Record<StatusComponentKey, StatusChecker> = {
  [StatusComponentKey.GEMINI_AI]: checkGeminiStatus,
  [StatusComponentKey.DATABASE]: checkDatabaseStatus,
  [StatusComponentKey.AUTH]: checkAuthStatus,
}
