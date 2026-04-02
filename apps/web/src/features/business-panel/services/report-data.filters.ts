import { REPORT_TYPES, type ReportFilters, type ReportType } from '../types/report-data.types'

const reportTypeSet = new Set<string>(REPORT_TYPES)

function parseListParam(value: string | null) {
  if (!value) {
    return undefined
  }

  const items = Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )

  return items.length > 0 ? items : undefined
}

export function parseReportType(value: string | null): ReportType | null {
  if (!value) {
    return 'users'
  }

  return reportTypeSet.has(value) ? (value as ReportType) : null
}

export function parseReportFilters(
  searchParams: URLSearchParams,
  reportType: ReportType,
): ReportFilters {
  return {
    report_type: reportType,
    start_date: searchParams.get('start_date') || undefined,
    end_date: searchParams.get('end_date') || undefined,
    user_ids: parseListParam(searchParams.get('user_ids')),
    course_ids: parseListParam(searchParams.get('course_ids')),
    role: searchParams.get('role') || 'all',
    status: searchParams.get('status') || 'all',
  }
}
