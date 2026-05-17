import type { getServiceClient } from '@/core/supabase/service-client'

import type {
  CreatePlanInput,
  CreateSessionInput,
  NormalizedSessionListQuery,
  StudyPlan,
  StudySession,
  UpdateSessionInput,
} from './study-planner.types'

export interface StudyPlannerRepository {
  findSessions(
    userId: string,
    query: NormalizedSessionListQuery,
  ): Promise<{ sessions: StudySession[]; total: number }>
  findSessionById(sessionId: string, userId: string): Promise<StudySession>
  createSession(userId: string, data: CreateSessionInput): Promise<StudySession>
  updateSession(
    sessionId: string,
    userId: string,
    data: UpdateSessionInput,
  ): Promise<StudySession>
  deleteSession(sessionId: string, userId: string): Promise<void>
  findPlans(userId: string): Promise<StudyPlan[]>
  findPlanById(planId: string, userId: string): Promise<StudyPlan>
  createPlan(userId: string, data: CreatePlanInput): Promise<StudyPlan>
}

export type StudyPlannerDbClient = ReturnType<typeof getServiceClient>
