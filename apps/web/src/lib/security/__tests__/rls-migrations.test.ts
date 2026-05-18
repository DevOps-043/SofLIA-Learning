import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function collectSqlFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return collectSqlFiles(fullPath)
    }

    return entry.isFile() && entry.name.endsWith('.sql') ? [fullPath] : []
  })
}

function normalizeTableName(rawTableName: string): string {
  return rawTableName.replaceAll('"', '').toLowerCase()
}

function extractMatches(source: string, pattern: RegExp): string[] {
  return Array.from(source.matchAll(pattern), (match) => normalizeTableName(match[1]))
}

function stripSqlComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
}

describe('Supabase migration RLS guardrails', () => {
  it('enables row level security for every public table created in migrations', () => {
    const migrationsDir = path.resolve(process.cwd(), '../../supabase/migrations')
    const sqlSources = stripSqlComments(
      collectSqlFiles(migrationsDir)
        .map((filePath) => fs.readFileSync(filePath, 'utf8'))
        .join('\n'),
    )

    const createdTables = new Set(
      extractMatches(
        sqlSources,
        /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?("?[\w]+"?)/gi,
      ),
    )

    const rlsEnabledTables = new Set(
      extractMatches(
        sqlSources,
        /alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\.)?("?[\w]+"?)\s+enable\s+row\s+level\s+security/gi,
      ),
    )

    const missingRls = Array.from(createdTables)
      .filter((tableName) => !rlsEnabledTables.has(tableName))
      .sort()

    expect(createdTables.size).toBeGreaterThan(0)
    expect(missingRls).toEqual([])
  })
})
