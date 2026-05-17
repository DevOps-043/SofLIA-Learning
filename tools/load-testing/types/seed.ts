export interface QaUser {
  index: number
  userId: string
  username: string
  email: string
  sessionToken: string
  orgId: string
  orgSlug: string
  courseId?: string
  courseSlug?: string
  moduleId?: string
  lessonId?: string
  planId?: string
  sessionId?: string
  trackingId?: string
}

export interface SeedManifest {
  runId: string
  createdAt: string
  prefix: string
  orgId: string
  orgSlug: string
  courseId?: string
  courseSlug?: string
  moduleId?: string
  lessonId?: string
  users: QaUser[]
  warnings: string[]
  instructorId?: string
}
