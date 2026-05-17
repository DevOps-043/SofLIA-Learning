import { DatabaseError, ForbiddenError, NotFoundError } from '@/core/errors/app-error'
import { logger } from '@/core/logging/logger'
import type { Database } from '@/core/supabase/database.types'

import { mapStudyPlan, toGoalHoursPerWeek } from './study-planner.mappers'
import type { StudyPlannerDbClient } from './study-planner.repository.contract'
import type { CreatePlanInput } from './study-planner.types'

export async function findPlans(client: StudyPlannerDbClient, userId: string) {
  const { data, error } = await client
    .from('study_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching study plans', { error: error.message })
    throw new DatabaseError('Error al obtener planes de estudio')
  }

  return (data ?? []).map((plan) => mapStudyPlan(plan))
}

export async function findPlanById(
  client: StudyPlannerDbClient,
  planId: string,
  userId: string,
) {
  const { data, error } = await client
    .from('study_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle()

  if (error || !data) {
    throw new NotFoundError('Plan de estudio no encontrado')
  }

  if (data.user_id !== userId) {
    throw new ForbiddenError()
  }

  return mapStudyPlan(data)
}

export async function createPlan(
  client: StudyPlannerDbClient,
  userId: string,
  data: CreatePlanInput,
) {
  const now = new Date().toISOString()
  const payload: Database['public']['Tables']['study_plans']['Insert'] = {
    user_id: userId,
    name: data.title,
    course_ids: data.courseId ? [data.courseId] : [],
    start_date: data.startDate,
    end_date: data.endDate,
    goal_hours_per_week: toGoalHoursPerWeek(data.dailyStudyMinutes),
    timezone: 'UTC',
    preferred_days: [],
    created_at: now,
    updated_at: now,
  }

  const { data: result, error } = await client
    .from('study_plans')
    .insert(payload)
    .select('*')
    .single()

  if (error || !result) {
    logger.error('Error creating study plan', { error: error?.message })
    throw new DatabaseError('Error al crear plan de estudio')
  }

  return mapStudyPlan(result)
}
