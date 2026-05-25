import type { ReportsAnalyticsAiInsights } from '../../../types/reports-analytics.types'
import type { createPdfReportContext } from './pdf-context'
import { addBulletList, addHeading } from './pdf-text'

export function addRiskSections(
  ctx: ReturnType<typeof createPdfReportContext>,
  insights: ReportsAnalyticsAiInsights,
  labels: Record<string, string>,
) {
  addHeading(ctx, labels.risks, 14)
  addBulletList(ctx, insights.risks)
  addHeading(ctx, labels.recommendations, 14)
  addBulletList(ctx, insights.recommendations)

  if (!insights.actionPlan?.length) return
  addHeading(ctx, labels.actionPlan, 14)
  insights.actionPlan.forEach((section) => {
    addHeading(ctx, section.title, 12)
    addBulletList(ctx, section.points)
  })
}
