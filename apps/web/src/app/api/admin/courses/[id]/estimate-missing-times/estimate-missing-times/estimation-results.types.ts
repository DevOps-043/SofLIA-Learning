export interface EstimationUpdateSummary {
  updatedMaterials: number
  updatedActivities: number
  recalculatedLessons: number
  recalculationErrors: string[]
}

export interface EstimationSourceCounts {
  geminiUpdatedCount: number
  fallbackCount: number
}
