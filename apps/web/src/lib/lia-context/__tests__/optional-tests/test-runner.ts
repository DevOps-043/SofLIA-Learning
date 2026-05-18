import { logger as techDebtLogger } from '@/lib/utils/logger'
export type TestResult = {
  passed: number
  failed: number
}

export type TestCaseMap = Record<string, () => TestResult | Promise<TestResult>>

export function createCounter() {
  return {
    failed: 0,
    passed: 0,
    check(condition: boolean, passMessage: string, failMessage: string) {
      if (condition) {
        techDebtLogger.log(`OK ${passMessage}`)
        this.passed += 1
        return
      }
      techDebtLogger.log(`FAIL ${failMessage}`)
      this.failed += 1
    },
    result(): TestResult {
      return { passed: this.passed, failed: this.failed }
    },
  }
}

export async function runTestSuite(title: string, tests: TestCaseMap) {
  techDebtLogger.log('='.repeat(60))
  techDebtLogger.log(title)
  techDebtLogger.log('='.repeat(60))

  const results: Record<string, TestResult> = {}
  for (const [name, testCase] of Object.entries(tests)) {
    results[name] = await testCase()
  }

  printSummary(results)
}

function printSummary(results: Record<string, TestResult>) {
  techDebtLogger.log('\n' + '='.repeat(60))
  techDebtLogger.log('RESUMEN DE TESTS')
  techDebtLogger.log('='.repeat(60))

  let totalPassed = 0
  let totalFailed = 0
  for (const [name, result] of Object.entries(results)) {
    const status = result.failed === 0 ? 'OK' : 'WARN'
    techDebtLogger.log(`${status} ${name}: ${result.passed} passed, ${result.failed} failed`)
    totalPassed += result.passed
    totalFailed += result.failed
  }

  techDebtLogger.log('-'.repeat(60))
  techDebtLogger.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`)
  techDebtLogger.log(`Porcentaje de exito: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`)
  if (totalFailed > 0) process.exit(1)
}
