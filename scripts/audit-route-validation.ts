/**
 * Auditoria anti-regresion de Tarea 1.4 (validacion Zod en API routes).
 *
 * Detecta route handlers que parsean el body con `request.json()` / `req.json()`
 * SIN pasar por el helper `withZodBody`. Esos casos representan deuda tecnica:
 * input sin validar contra un schema Zod.
 *
 * Allowlist: rutas que parsean manualmente de forma intencional porque componen
 * con `withAuth` y necesitan el contexto de auth antes de validar el body. Esas
 * rutas DEBEN seguir usando un schema Zod via `.safeParse()` dentro del handler.
 *
 * Uso:
 *   npx tsx scripts/audit-route-validation.ts
 *   CI_STRICT_TECH_DEBT=true npx tsx scripts/audit-route-validation.ts  // exit 1 si hay violaciones nuevas
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const API_ROOT = join(process.cwd(), 'apps', 'web', 'src', 'app', 'api')
const STRICT = process.env.CI_STRICT_TECH_DEBT === 'true'

/**
 * Rutas que parsean el body manualmente a proposito (composicion con `withAuth`).
 * Cada una DEBE validar el body con un schema Zod via `.safeParse()`.
 * Mantener esta lista al minimo y revisarla en cada PR que la toque.
 */
const INTENTIONAL_MANUAL_PARSE = new Set<string>([
  'apps/web/src/app/api/auth/mfa/route.ts',
  'apps/web/src/app/api/auth/mfa/verify/route.ts',
  'apps/web/src/app/api/auth/mfa/activate/route.ts',
])

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

    if (ZOD_GUARD_PATTERN.test(source)) continue

    if (INTENTIONAL_MANUAL_PARSE.has(relPath)) {
      if (!ZOD_SCHEMA_PATTERN.test(source)) {
        violations.push({
          file: relPath,
          reason:
            'Ruta en allowlist de parseo manual pero NO valida el body con un schema Zod (.safeParse).',
        })
      }
      continue
    }

    violations.push({
      file: relPath,
      reason:
        'Parsea request.json() sin withZodBody ni schema Zod. Migrar al patron de docs/tech-debt/route-migration-pattern.md.',
    })
  }

  const output = {
    checkedFiles: files.length,
    strict: STRICT,
    allowlistedManualParse: [...INTENTIONAL_MANUAL_PARSE],
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
