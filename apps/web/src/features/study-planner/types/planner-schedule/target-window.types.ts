export interface StudyPlannerTargetWindow {
  targetDateObj: Date | null
  weeksUntilTarget: number
  bufferDays: number
  adjustedTargetDate: Date | null
}
