import type { User } from './user'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    statusCode?: number
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasNext?: boolean
    hasPrev?: boolean
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
  fingerprint?: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
