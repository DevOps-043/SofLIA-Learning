
import type { ExportColumn, ExportCopy } from './export.types'

export function getMetricColumns(copy: ExportCopy): ExportColumn[] {
  return [
    { key: 'metric', header: copy.metric },
    { key: 'value', header: copy.value },
    { key: 'detail', header: copy.detail },
  ]
}

export function getUserColumns(copy: ExportCopy): ExportColumn[] {
  return [
    'user',
    'email',
    'status',
    'role',
    'jobTitle',
    'gender',
    'age',
    'ageBand',
    'region',
    'zone',
    'team',
    'assigned',
    'completed',
    'progress',
    'overdue',
    'lessons',
    'minutes',
    'sofliaConversations',
    'sofliaMessages',
    'notes',
    'activities',
    'attempts',
    'evaluations',
    'score',
    'quality',
    'planned',
    'plannerDone',
    'plannerMissed',
    'plannerRate',
    'lastConnection',
    'lastActivity',
  ].map((key) => ({ key, header: copy.columns[key] || key }))
}

export function getCourseColumns(copy: ExportCopy): ExportColumn[] {
  return [
    'course',
    'assigned',
    'active',
    'completed',
    'progress',
    'overdue',
    'notesCount',
    'sofliaConversations',
    'activities',
    'score',
  ].map((key) => ({ key, header: copy.columns[key] || key }))
}

export function getSegmentColumns(copy: ExportCopy): ExportColumn[] {
  return [
    { key: 'segmentType', header: copy.columns.segmentType },
    { key: 'label', header: copy.columns.label },
    { key: 'users', header: copy.columns.user },
    { key: 'averageProgress', header: copy.columns.progress },
    { key: 'completionRate', header: 'Finalizacion' },
    { key: 'averageCompletionDays', header: 'Dias promedio' },
    { key: 'sofliaAdoptionRate', header: 'SofLIA' },
    { key: 'notesAdoptionRate', header: copy.columns.notes },
    { key: 'quizAverageScore', header: copy.columns.score },
    { key: 'qualityScore', header: copy.columns.quality },
  ]
}
