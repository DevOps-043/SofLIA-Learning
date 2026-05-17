import type { TestSuite } from './types'

export async function runSuites(title: string, suites: TestSuite[]) {
  console.log('='.repeat(60))
  console.log(title)
  console.log('='.repeat(60))

  const results = await Promise.all(suites.map(async (suite) => [suite.name, await suite.run()] as const))
  let totalPassed = 0
  let totalFailed = 0

  console.log('
' + '='.repeat(60))
  console.log('RESUMEN DE TESTS')
  console.log('='.repeat(60))

  results.forEach(([name, result]) => {
    console.log((result.failed === 0 ? 'OK' : 'WARN') + ' ' + name + ': ' + result.passed + ' passed, ' + result.failed + ' failed')
    totalPassed += result.passed
    totalFailed += result.failed
  })

  console.log('-'.repeat(60))
  console.log('TOTAL: ' + totalPassed + ' passed, ' + totalFailed + ' failed')
  console.log('Porcentaje de exito: ' + Math.round((totalPassed / (totalPassed + totalFailed)) * 100) + '%')

  if (totalFailed > 0) process.exit(1)
}
