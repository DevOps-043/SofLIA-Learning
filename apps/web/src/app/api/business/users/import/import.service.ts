import { createClient } from '@/lib/supabase/server'
import {
  buildUserDataFromCsvLine,
  parseImportCsvContent,
} from './csv'
import { loadHierarchyAutoAssignConfig } from './hierarchy'
import { importUserRow } from './import-row.service'
import type { ImportResult } from './types'

export async function importBusinessUsersFromCsv(params: {
  fileContent: string
  organizationId: string
  createdBy: string
}) {
  const parsedCsv = parseImportCsvContent(params.fileContent)
  if ('error' in parsedCsv) return { success: false as const, error: parsedCsv.error }

  const supabase = await createClient()
  const hierarchy = await loadHierarchyAutoAssignConfig(
    supabase,
    params.organizationId,
  )
  const result: ImportResult = {
    success: 0,
    errors: [],
    total: parsedCsv.total,
  }

  for (let i = 1; i < parsedCsv.lines.length; i++) {
    const line = parsedCsv.lines[i].trim()
    if (!line) continue

    const userData = buildUserDataFromCsvLine(parsedCsv.headers, line)

    try {
      const rowResult = await importUserRow({
        supabase,
        userData,
        context: {
          organizationId: params.organizationId,
          createdBy: params.createdBy,
          hierarchy,
        },
      })

      if (rowResult.success) {
        result.success++
      } else {
        result.errors.push({
          row: i + 1,
          error: rowResult.error,
          data: rowResult.data || userData,
        })
      }
    } catch (error) {
      result.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Error desconocido',
        data: {},
      })
    }
  }

  return { success: true as const, result }
}
