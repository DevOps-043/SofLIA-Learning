import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { TestResult } from './types'

export function check(result: TestResult, condition: boolean, success: string, failure: string) {
  if (condition) {
    techDebtLogger.log('OK ' + success)
    result.passed += 1
    return
  }

  techDebtLogger.log('FAIL ' + failure)
  result.failed += 1
}
