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
        console.log(`OK ${passMessage}`)
        this.passed += 1
        return
      }
      console.log(`FAIL ${failMessage}`)
      this.failed += 1
    },
    result(): TestResult {
      return { passed: this.passed, failed: this.failed }
    },
  }
}

export async function runTestSuite(title: string, tests: TestCaseMap) {
  console.log('='.repeat(60))
  console.log(title)
  console.log('='.repeat(60))

  const results: Record<string, TestResult> = {}
  for (const [name, testCase] of Object.entries(tests)) {
    results[name] = await testCase()
  }

  printSummary(results)
}

function printSummary(results: Record<string, TestResult>) {
  console.log('\n' + '='.repeat(60))
  console.log('RESUMEN DE TESTS')
  console.log('='.repeat(60))

  let totalPassed = 0
  let totalFailed = 0
  for (const [name, result] of Object.entries(results)) {
    const status = result.failed === 0 ? 'OK' : 'WARN'
    console.log(`${status} ${name}: ${result.passed} passed, ${result.failed} failed`)
    totalPassed += result.passed
    totalFailed += result.failed
  }

  console.log('-'.repeat(60))
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`)
  console.log(`Porcentaje de exito: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`)
  if (totalFailed > 0) process.exit(1)
}
