import { SessionAnalyzer } from '@/lib/rrweb/session-analyzer'
import type { ProactiveHelpRequest } from './types'

const SESSION_WINDOW_MS = 180000

export function analyzeProactiveSession(body: ProactiveHelpRequest) {
  if (!body.sessionEvents || body.sessionEvents.length === 0) return null

  const sessionAnalyzer = new SessionAnalyzer()
  return sessionAnalyzer.analyzeSession(body.sessionEvents, SESSION_WINDOW_MS)
}
