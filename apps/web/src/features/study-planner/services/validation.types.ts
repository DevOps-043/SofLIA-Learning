export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface DeadlineValidation {
  courseId: string
  courseTitle: string
  dueDate: string
  estimatedCompletionDate: string
  canComplete: boolean
  daysOverdue?: number
  suggestedAction?: string
}
