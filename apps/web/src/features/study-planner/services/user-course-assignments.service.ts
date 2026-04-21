import type {
  B2BCourseAssignment,
  B2CCoursePurchase,
  CourseAssignment,
  TeamCourseAssignment,
  UserType,
} from '../types/user-context.types'
import { getTeamCourseAssignments } from './user-course-assignments/hierarchy.service'
import {
  getB2BCourseAssignments,
  getUpcomingDeadlines,
} from './user-course-assignments/organization.service'
import { getB2CCoursePurchases } from './user-course-assignments/purchases.service'
import { getUserCourses } from './user-course-assignments/user-courses.service'

export class UserCourseAssignmentsService {
  static getB2BCourseAssignments(
    userId: string,
  ): Promise<B2BCourseAssignment[]> {
    return getB2BCourseAssignments(userId)
  }

  static getTeamCourseAssignments(
    userId: string,
  ): Promise<TeamCourseAssignment[]> {
    return getTeamCourseAssignments(userId)
  }

  static getB2CCoursePurchases(
    userId: string,
  ): Promise<B2CCoursePurchase[]> {
    return getB2CCoursePurchases(userId)
  }

  static getUserCourses(
    userId: string,
    userType: UserType,
  ): Promise<CourseAssignment[]> {
    return getUserCourses(userId, userType)
  }

  static getUpcomingDeadlines(
    userId: string,
    daysAhead = 14,
  ): Promise<B2BCourseAssignment[]> {
    return getUpcomingDeadlines(userId, daysAhead)
  }
}
