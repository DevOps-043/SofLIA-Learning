
import type { ExcelTableColumn, ExportCopy } from './export.types'
import { getCourseColumns, getSegmentColumns, getUserColumns } from './columns-basic'

export function getWorkbookCourseColumns(copy: ExportCopy): ExcelTableColumn[] {
  return getCourseColumns(copy).map((column) => ({
    ...column,
    width: {
      course: 46,
      assigned: 16,
      active: 16,
      completed: 18,
      progress: 18,
      overdue: 14,
      notesCount: 14,
      sofliaConversations: 20,
      activities: 22,
      score: 20,
    }[column.key] || 18,
    kind: ['progress', 'activities', 'score'].includes(column.key) ? 'percent' : 'integer',
  }))
}

export function getWorkbookUserColumns(copy: ExportCopy): ExcelTableColumn[] {
  return getUserColumns(copy).map((column) => ({
    ...column,
    width: {
      user: 28,
      email: 34,
      jobTitle: 26,
      region: 22,
      zone: 22,
      team: 24,
      lastConnection: 22,
      lastActivity: 22,
    }[column.key] || 16,
    kind: ['progress', 'score', 'quality', 'plannerRate'].includes(column.key)
      ? 'percent'
      : ['lastConnection', 'lastActivity'].includes(column.key)
        ? 'date'
        : ['user', 'email', 'status', 'role', 'jobTitle', 'gender', 'ageBand', 'region', 'zone', 'team'].includes(column.key)
          ? 'text'
          : 'integer',
  }))
}

export function getWorkbookSegmentColumns(copy: ExportCopy): ExcelTableColumn[] {
  return getSegmentColumns(copy).map((column) => ({
    ...column,
    width: {
      segmentType: 22,
      label: 32,
      users: 14,
    }[column.key] || 18,
    kind: ['averageProgress', 'completionRate', 'sofliaAdoptionRate', 'notesAdoptionRate', 'quizAverageScore', 'qualityScore'].includes(column.key)
      ? 'percent'
      : column.key === 'users'
        ? 'integer'
        : 'text',
  }))
}
