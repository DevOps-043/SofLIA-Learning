import { z } from 'zod'
import type { ReportsAnalyticsReportSectionId } from '../../../types/reports-analytics.types'

export const SECTION_IDS: ReportsAnalyticsReportSectionId[] = [
  'executive',
  'dashboard',
  'trends',
  'courses',
  'users',
  'segments',
  'quality',
  'rawData',
]

const sectionIdSchema = z.enum(
  SECTION_IDS as [ReportsAnalyticsReportSectionId, ...ReportsAnalyticsReportSectionId[]],
)

const sectionSchema = z.object({
  id: sectionIdSchema,
  title: z.string().min(1).max(80),
  purpose: z.string().min(1).max(180),
  priority: z.coerce.number().min(1).max(10),
})

export const blueprintSchema = z.object({
  summary: z.string().min(1).max(900),
  sections: z.array(sectionSchema).min(1).max(12),
  featuredMetrics: z.array(z.object({
    label: z.string().min(1).max(80),
    value: z.string().min(1).max(60),
    detail: z.string().max(160).default(''),
  })).max(8).default([]),
  findings: z.array(z.object({
    title: z.string().min(1).max(100),
    points: z.array(z.string().min(1).max(220)).min(1).max(5),
  })).max(8).default([]),
  risks: z.array(z.string().min(1).max(220)).max(8).default([]),
  recommendations: z.array(z.string().min(1).max(220)).max(8).default([]),
  artifactPlan: z.array(z.object({
    id: sectionIdSchema,
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(180),
    includeInCsv: z.boolean().default(true),
    includeInWorkbook: z.boolean().default(true),
  })).max(12).default([]),
})
