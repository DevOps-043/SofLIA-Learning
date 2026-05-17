export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  isRead: boolean
  actionUrl?: string
  createdAt: Date
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum VoteType {
  UP = 'up',
  DOWN = 'down',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text',
}
