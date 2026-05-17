import type { LoadProfileName, QaUser } from './types'

export interface RequestOptions {
  runId: string
  profile: LoadProfileName | 'manual'
  flow: string
  name: string
  method?: string
  baseUrl: string
  path: string
  user?: QaUser
  body?: unknown
  timeoutMs: number
  headers?: Record<string, string>
  captureResponseText?: boolean
}
