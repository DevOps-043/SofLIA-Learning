import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const servicesDir = resolve(
  process.cwd(),
  'src/features/study-planner/services'
)

describe('soflia-context compatibility', () => {
  it('keeps the legacy wrapper pointed at the modular implementation', () => {
    const legacySource = readFileSync(
      resolve(servicesDir, 'soflia-context.service.ts'),
      'utf8'
    )

    expect(legacySource).toContain("from './lia-context.service'")
  })

  it('exports the modular context service from the services barrel', () => {
    const servicesIndexSource = readFileSync(
      resolve(servicesDir, 'index.ts'),
      'utf8'
    )

    expect(servicesIndexSource).toContain("export * from './lia-context.service'")
    expect(servicesIndexSource).not.toContain("export * from './soflia-context.service'")
  })
})
