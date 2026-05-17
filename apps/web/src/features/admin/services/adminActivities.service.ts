import {
  createActivity,
  deleteActivity,
  getActivityById,
  getLessonActivities,
  recalculateLessonDuration,
  reorderActivities,
  updateActivity,
  updateModuleDurationFromLesson,
} from './admin-activities'
import type {
  AdminActivity,
  CreateActivityData,
  UpdateActivityData,
} from './admin-activities/admin-activities.types'

export type { AdminActivity, CreateActivityData, UpdateActivityData } from './admin-activities/admin-activities.types'

export class AdminActivitiesService {
  static async getLessonActivities(lessonId: string): Promise<AdminActivity[]> {
    return getLessonActivities(lessonId)
  }

  static async getActivityById(activityId: string): Promise<AdminActivity | null> {
    return getActivityById(activityId)
  }

  static async createActivity(
    lessonId: string,
    activityData: CreateActivityData,
    userId?: string,
  ): Promise<AdminActivity> {
    return createActivity(lessonId, activityData, userId)
  }

  static async updateActivity(
    activityId: string,
    activityData: UpdateActivityData,
  ): Promise<AdminActivity> {
    return updateActivity(activityId, activityData)
  }

  static async deleteActivity(activityId: string): Promise<void> {
    return deleteActivity(activityId)
  }

  static async reorderActivities(
    lessonId: string,
    activities: Array<{ activity_id: string; activity_order_index: number }>,
  ): Promise<void> {
    return reorderActivities(lessonId, activities)
  }

  static async updateModuleDurationFromLesson(lessonId: string): Promise<void> {
    return updateModuleDurationFromLesson(lessonId)
  }

  static async recalculateLessonDuration(lessonId: string): Promise<void> {
    return recalculateLessonDuration(lessonId)
  }
}
