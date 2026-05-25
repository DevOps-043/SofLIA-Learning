import type { User } from './user'

export interface CommunityQuestion {
  id: string
  userId: string
  title: string
  content: string
  tags: string[]
  votesCount: number
  answersCount: number
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
  user: User
  answers?: CommunityAnswer[]
}

export interface CommunityAnswer {
  id: string
  questionId: string
  userId: string
  content: string
  votesCount: number
  isAccepted: boolean
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Vote {
  id: string
  userId: string
  targetType: 'question' | 'answer'
  targetId: string
  voteType: 'up' | 'down'
  createdAt: Date
}
