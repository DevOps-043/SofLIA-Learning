import type { NextResponse } from 'next/server'

export interface RateLimitEntry {
  count: number
  resetTime: number
  requests: number[]
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  burst?: number
  message?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  response?: NextResponse
}
