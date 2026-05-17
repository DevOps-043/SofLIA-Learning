import { getServiceClient } from '@/core/supabase/service-client'

import {
  createPlan,
  findPlanById,
  findPlans,
} from './study-planner.repository.plans'
import type { StudyPlannerRepository } from './study-planner.repository.contract'
import {
  findSessionById,
  findSessions,
} from './study-planner.repository.sessions-read'
import {
  createSession,
  deleteSession,
  updateSession,
} from './study-planner.repository.sessions-write'
import type {
  CreatePlanInput,
  CreateSessionInput,
  NormalizedSessionListQuery,
  UpdateSessionInput,
} from './study-planner.types'

export type { StudyPlannerRepository } from './study-planner.repository.contract'

export class SupabaseStudyPlannerRepository implements StudyPlannerRepository {
  private readonly client = getServiceClient()

  findSessions(userId: string, query: NormalizedSessionListQuery) {
    return findSessions(this.client, userId, query)
  }

  findSessionById(sessionId: string, userId: string) {
    return findSessionById(this.client, sessionId, userId)
  }

  createSession(userId: string, data: CreateSessionInput) {
    return createSession(this.client, userId, data)
  }

  updateSession(sessionId: string, userId: string, data: UpdateSessionInput) {
    return updateSession(this.client, sessionId, userId, data)
  }

  deleteSession(sessionId: string, userId: string) {
    return deleteSession(this.client, sessionId, userId)
  }

  findPlans(userId: string) {
    return findPlans(this.client, userId)
  }

  findPlanById(planId: string, userId: string) {
    return findPlanById(this.client, planId, userId)
  }

  createPlan(userId: string, data: CreatePlanInput) {
    return createPlan(this.client, userId, data)
  }
}
