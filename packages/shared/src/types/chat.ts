export interface ChatMessage {
  id: string
  userId: string
  content: string
  role: 'user' | 'assistant'
  courseContext?: string
  moduleContext?: string
  createdAt: Date
}

export interface ChatSession {
  id: string
  userId: string
  title?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}
