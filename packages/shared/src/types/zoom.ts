export interface ZoomSession {
  id: string
  title: string
  description?: string
  startTime: Date
  duration: number
  joinUrl: string
  meetingId: string
  password?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
