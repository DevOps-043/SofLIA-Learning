import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const GUARDED_PATTERNS = [
  'requireOrgAccess',
  'requireBusiness(',
  'requireBusinessUser(',
  'resolveDashboardAuth(',
  'handleDeadlineSuggestionsRequest(',
]

function collectRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return collectRouteFiles(fullPath)
    }

    return /^route(?:\.[a-z]+)?\.ts$/.test(entry.name) ? [fullPath] : []
  })
}

function resolveExportedRouteFiles(filePath: string, source: string): string[] {
  const dir = path.dirname(filePath)
  const matches = source.matchAll(/export\s+\{[^}]+\}\s+from\s+['"](.\/route\.[^'"]+)['"]/g)
  return Array.from(matches, (match) => path.resolve(dir, `${match[1]}.ts`))
}

function isGuardedRoute(filePath: string, visited = new Set<string>()): boolean {
  if (visited.has(filePath)) {
    return false
  }

  visited.add(filePath)
  const source = fs.readFileSync(filePath, 'utf8')

  if (GUARDED_PATTERNS.some((pattern) => source.includes(pattern))) {
    return true
  }

  const exportedRouteFiles = resolveExportedRouteFiles(filePath, source)
  return exportedRouteFiles.length > 0 &&
    exportedRouteFiles.every((exportedFile) => isGuardedRoute(exportedFile, visited))
}

describe('tenant isolation route guards', () => {
  it('keeps every /api/[orgSlug] route behind the organization access guard flow', () => {
    const orgApiDir = path.resolve(process.cwd(), 'src/app/api/[orgSlug]')
    const routeFiles = collectRouteFiles(orgApiDir)
    const unguarded = routeFiles
      .filter((filePath) => !isGuardedRoute(filePath))
      .map((filePath) => path.relative(process.cwd(), filePath))

    expect(routeFiles.length).toBeGreaterThan(0)
    expect(unguarded).toEqual([])
  })
})
