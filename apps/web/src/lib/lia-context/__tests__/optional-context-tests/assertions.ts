import type { TestResult } from './types'

export function check(result: TestResult, condition: boolean, success: string, failure: string) {
  if (condition) {
    console.log('OK ' + success)
    result.passed += 1
    return
  }

  console.log('FAIL ' + failure)
  result.failed += 1
}
