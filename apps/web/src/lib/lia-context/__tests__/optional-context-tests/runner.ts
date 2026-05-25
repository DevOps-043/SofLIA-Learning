import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { TestSuite } from './types'

export async function runSuites(title: string, suites: TestSuite[]) {
  techDebtLogger.log('='.repeat(60))
  techDebtLogger.log(title)
  techDebtLogger.log('='.repeat(60))

  const results = await Promise.all(suites.map(async (suite) => [suite.name, await suite.run()] as const))
  let totalPassed = 0
  let totalFailed = 0

  techDebtLogger.log('\n' + '='.repeat(60))
  techDebtLogger.log('RESUMEN DE TESTS')
  techDebtLogger.log('='.repeat(60))

  results.forEach(([name, result]) => {
    techDebtLogger.log((result.failed === 0 ? 'OK' : 'WARN') + ' ' + name + ': ' + result.passed + ' passed, ' + result.failed + ' failed')
    totalPassed += result.passed
    totalFailed += result.failed
  })

  techDebtLogger.log('-'.repeat(60))
  techDebtLogger.log('TOTAL: ' + totalPassed + ' passed, ' + totalFailed + ' failed')
  techDebtLogger.log('Porcentaje de exito: ' + Math.round((totalPassed / (totalPassed + totalFailed)) * 100) + '%')

  if (totalFailed > 0) process.exit(1)
}
