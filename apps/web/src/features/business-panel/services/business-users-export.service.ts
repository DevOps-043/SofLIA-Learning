import 'server-only'

import type { BusinessUser } from './businessUsers.service'
import { BusinessUsersServerService } from './businessUsers.server.service'

const USER_EXPORT_COLUMNS = [
  'username',
  'email',
  'first_name',
  'last_name',
  'display_name',
  'date_of_birth',
  'gender',
  'job_title',
  'org_role',
  'org_status',
  'password',
] as const

const REDACTED_PASSWORD_VALUE = '****************'

export async function buildOrganizationUsersCsvExport(
  organizationId: string,
): Promise<string> {
  const users = await BusinessUsersServerService.getOrganizationUsers(organizationId)
  return buildUsersCsv(users)
}

export function buildUsersCsv(users: BusinessUser[]): string {
  const rows = users.map((user) =>
    [
      user.username,
      user.email,
      user.first_name,
      user.last_name,
      user.display_name,
      user.date_of_birth,
      user.gender,
      user.job_title,
      user.org_role ?? 'member',
      user.org_status ?? 'active',
      REDACTED_PASSWORD_VALUE,
    ].map(escapeCsvCell).join(','),
  )

  return `\uFEFF${[USER_EXPORT_COLUMNS.join(','), ...rows].join('\n')}`
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''

  const rawValue = sanitizeSpreadsheetFormula(String(value))
  if (!/[",\r\n]/.test(rawValue)) return rawValue

  return `"${rawValue.replace(/"/g, '""')}"`
}

function sanitizeSpreadsheetFormula(value: string): string {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value
}
