import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import {
  auditSupabasePaginationSource,
  type PaginationAuditViolation,
} from '../apps/web/src/lib/api/supabase-pagination-audit'

const API_ROOT = join(process.cwd(), 'apps', 'web', 'src', 'app', 'api')
const STRICT = process.env.CI_STRICT_TECH_DEBT === 'true'

interface FilePaginationAuditViolation extends PaginationAuditViolation {
  file: string
}

async function main() {
  const files = await collectRouteFiles(API_ROOT)
  const violations: FilePaginationAuditViolation[] = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const fileViolations = auditSupabasePaginationSource(source)
    for (const violation of fileViolations) {
      violations.push({
        file: relative(process.cwd(), file),
        ...violation,
      })
    }
  }

  const output = {
    checkedFiles: files.length,
    strict: STRICT,
    violations,
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)

  if (STRICT && violations.length > 0) {
    process.exitCode = 1
  }
}

async function collectRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name)
      if (entry.isDirectory()) return collectRouteFiles(fullPath)
      if (entry.isFile() && /^route\.(ts|tsx)$/.test(entry.name)) return [fullPath]
      return []
    }),
  )

  return files.flat()
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`audit-api-pagination failed: ${message}\n`)
  process.exitCode = 1
})
