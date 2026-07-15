import {
  AlertTriangle,
  BookOpenCheck,
  Brain,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReportsAnalyticsOverview } from '../../types/reports-analytics.types'

export const overviewMetricKeys: Array<{
  key: string
  icon: LucideIcon
  valueKey: keyof ReportsAnalyticsOverview
  suffixKey?: keyof ReportsAnalyticsOverview
  isPercent?: boolean
}> = [
  { key: 'activeLearners', icon: Users, valueKey: 'activeLearners', suffixKey: 'activeLearnerRate' },
  { key: 'averageProgress', icon: Target, valueKey: 'averageProgress', isPercent: true },
  { key: 'completionRate', icon: BookOpenCheck, valueKey: 'completionRate', isPercent: true },
  { key: 'qualityScore', icon: ShieldCheck, valueKey: 'qualityScore', isPercent: true },
  { key: 'sofliaAdoptionRate', icon: Brain, valueKey: 'sofliaAdoptionRate', isPercent: true },
  { key: 'overdueAssignments', icon: AlertTriangle, valueKey: 'overdueAssignments' },
] as const
