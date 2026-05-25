import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SOURCE_ROOT = path.resolve(process.cwd(), 'src')
const SERVICE_ROLE_PATTERN = 'process.env.SUPABASE_SERVICE_ROLE_KEY'

describe('service role key convention', () => {
  it('keeps service role usage in routes, tests, or server-only modules', () => {
    const violations = findServiceRoleFiles()
      .filter((filePath) => {
        const normalizedPath = normalizePath(filePath)
        const source = fs.readFileSync(filePath, 'utf8')

        return !isApiRoute(normalizedPath) &&
          !isTestFile(normalizedPath) &&
          !isServerOnlyModule(normalizedPath, source)
      })

    expect(violations).toEqual([])
  })
})

function findServiceRoleFiles(): string[] {
  try {
    const output = execFileSync(
      'rg',
      [
        '-l',
        SERVICE_ROLE_PATTERN,
        SOURCE_ROOT,
        '--glob',
        '*.ts',
        '--glob',
        '*.tsx',
        '--glob',
        '*.js',
        '--glob',
        '*.jsx',
      ],
      { encoding: 'utf8' },
    )

    return output.split(/\r?\n/).filter(Boolean)
  } catch {
    return []
  }
}

function normalizePath(filePath: string) {
  return filePath.replaceAll(path.sep, '/')
}

function isApiRoute(filePath: string) {
  return /\/app\/api\/.*\/route(\.|$)/.test(filePath)
}

function isTestFile(filePath: string) {
  return filePath.includes('/__tests__/')
}

function isServerOnlyModule(filePath: string, source: string) {
  return filePath.endsWith('.server.ts') || source.includes("import 'server-only'")
}
