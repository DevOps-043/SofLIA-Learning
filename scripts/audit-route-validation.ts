/**
 * Auditoria anti-regresion de Tarea 1.4 (validacion Zod en API routes).
 *
 * Detecta route handlers que parsean el body con `request.json()` / `req.json()`
 * SIN pasar por `withZodBody` ni validar inmediatamente con un schema Zod.
 *
 * Uso:
 *   npx tsx scripts/audit-route-validation.ts
 *   CI_STRICT_TECH_DEBT=true npx tsx scripts/audit-route-validation.ts  // exit 1 si hay violaciones nuevas
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const API_ROOT = join(process.cwd(), 'apps', 'web', 'src', 'app', 'api')
const STRICT = process.env.CI_STRICT_TECH_DEBT === 'true'

const RAW_JSON_PATTERN = /\b(?:await\s+)?(?:request|req)\.json\s*\(\s*\)/
const ZOD_GUARD_PATTERN = /\bwithZodBody\b/
const ZOD_SCHEMA_PATTERN = /\.safeParse\s*\(/

interface RouteViolation {
  file: string
  reason: string
}

async function main() {
  const files = await collectRouteFiles(API_ROOT)
  const violations: RouteViolation[] = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (!RAW_JSON_PATTERN.test(source)) continue

    const relPath = relative(process.cwd(), file).split('\\').join('/')

    if (ZOD_GUARD_PATTERN.test(source) || ZOD_SCHEMA_PATTERN.test(source)) continue

    violations.push({
      file: relPath,
      reason:
        'Parsea request.json() sin withZodBody ni schema Zod safeParse().',
    })
  }

  const output = {
    checkedFiles: files.length,
    strict: STRICT,
    violations,
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)

  if (STRICT && violations.length > 0) {
    process.stderr.write(
      `\naudit-route-validation: ${violations.length} ruta(s) con body sin validar.\n`,
    )
    process.exitCode = 1
  }
}

async function collectRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name)
      if (entry.isDirectory()) return collectRouteFiles(fullPath)
      if (entry.isFile() && /^route(\.[a-z]+)?\.(ts|tsx)$/.test(entry.name)) {
        return [fullPath]
      }
      return []
    }),
  )

  return files.flat()
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`audit-route-validation failed: ${message}\n`)
  process.exitCode = 1
})
