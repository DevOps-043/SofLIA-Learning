import {
  SupabaseStudyPlannerRepository,
  type StudyPlannerRepository,
} from './study-planner.repository'
import { calculateTotalPages, normalizeSessionListQuery } from './study-planner.utils'
import type {
  CreatePlanInput,
  CreateSessionInput,
  StudyPlan,
  StudySession,
  StudySessionListQuery,
  StudySessionListResult,
  UpdateSessionInput,
} from './study-planner.types'

export class StudyPlannerService {
  constructor(
    private readonly repository: StudyPlannerRepository = new SupabaseStudyPlannerRepository(),
  ) {}

  async getSessions(userId: string, query: StudySessionListQuery): Promise<StudySessionListResult> {
    const normalized = normalizeSessionListQuery(query)
    const { sessions, total } = await this.repository.findSessions(userId, normalized)

    return {
      sessions,
      total,
      page: normalized.page,
      limit: normalized.limit,
      total_pages: calculateTotalPages(total, normalized.limit),
    }
  }

  async getSessionById(sessionId: string, userId: string): Promise<StudySession> {
    return this.repository.findSessionById(sessionId, userId)
  }

  async createSession(userId: string, data: CreateSessionInput): Promise<StudySession> {
    return this.repository.createSession(userId, data)
  }

  async updateSession(
    sessionId: string,
    userId: string,
    data: UpdateSessionInput,
  ): Promise<StudySession> {
    return this.repository.updateSession(sessionId, userId, data)
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    return this.repository.deleteSession(sessionId, userId)
  }

  async getPlans(userId: string): Promise<StudyPlan[]> {
    return this.repository.findPlans(userId)
  }

  async getPlanById(planId: string, userId: string): Promise<StudyPlan> {
    return this.repository.findPlanById(planId, userId)
  }

  async createPlan(userId: string, data: CreatePlanInput): Promise<StudyPlan> {
    return this.repository.createPlan(userId, data)
  }
}
