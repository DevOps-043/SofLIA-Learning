import { describe, expect, it } from 'vitest'
import { parseReportFilters, parseReportType } from '../report-data.filters'

describe('parseReportType', () => {
  it('returns users when the type is omitted', () => {
    expect(parseReportType(null)).toBe('users')
  })

  it('returns null when the type is invalid', () => {
    expect(parseReportType('unknown-report')).toBeNull()
  })
})

describe('parseReportFilters', () => {
  it('parses and deduplicates list filters', () => {
    const searchParams = new URLSearchParams({
      user_ids: 'user-1, user-2,user-1,,',
      course_ids: 'course-1,course-2,course-1',
      role: 'admin',
      status: 'active',
      start_date: '2026-03-01',
      end_date: '2026-03-31',
    })

    expect(parseReportFilters(searchParams, 'users')).toEqual({
      report_type: 'users',
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      user_ids: ['user-1', 'user-2'],
      course_ids: ['course-1', 'course-2'],
      role: 'admin',
      status: 'active',
    })
  })

  it('defaults role and status to all when they are missing', () => {
    const searchParams = new URLSearchParams()

    expect(parseReportFilters(searchParams, 'lia-analysis')).toEqual({
      report_type: 'lia-analysis',
      start_date: undefined,
      end_date: undefined,
      user_ids: undefined,
      course_ids: undefined,
      role: 'all',
      status: 'all',
    })
  })
})
