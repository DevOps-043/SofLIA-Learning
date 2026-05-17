export interface TestResult {
  passed: number
  failed: number
}

export interface TestSuite {
  name: string
  run: () => TestResult | Promise<TestResult>
}

export function createResult(): TestResult {
  return { passed: 0, failed: 0 }
}
