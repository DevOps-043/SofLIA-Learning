/**
 * UserContextService
 *
 * Orchestrates the full user context for the study planner by combining
 * identity, organisation, course assignments, and preferences data.
 */

import { UserIdentityService } from './user-identity.service';
import { UserOrganizationService } from './user-organization.service';
import { UserCourseAssignmentsService } from './user-course-assignments.service';
import { UserPreferencesService } from './user-preferences.service';
import type {
  UserType,
  UserContext,
  UserBasicInfo,
  UserProfessionalProfile,
  OrganizationInfo,
  WorkTeam,
  CourseAssignment,
  StudyPreferences,
  CalendarIntegration,
  B2BCourseAssignment,
  B2CCoursePurchase,
  TeamCourseAssignment,
} from '../types/user-context.types';

export { UserIdentityService } from './user-identity.service';
export { UserOrganizationService } from './user-organization.service';
export { UserCourseAssignmentsService } from './user-course-assignments.service';
export { UserPreferencesService } from './user-preferences.service';

export class UserContextService {
  static async getUserType(userId: string): Promise<UserType> {
    return UserIdentityService.getUserType(userId);
  }

  static async getUserBasicInfo(userId: string): Promise<UserBasicInfo> {
    return UserIdentityService.getUserBasicInfo(userId);
  }

  static async getUserProfile(
    userId: string
  ): Promise<UserProfessionalProfile | null> {
    return UserIdentityService.getUserProfile(userId);
  }

  static async getUserOrganization(
    userId: string
  ): Promise<OrganizationInfo | null> {
    return UserOrganizationService.getUserOrganization(userId);
  }

  static async getUserWorkTeams(userId: string): Promise<WorkTeam[]> {
    return UserOrganizationService.getUserWorkTeams(userId);
  }

  static async getB2BCourseAssignments(
    userId: string
  ): Promise<B2BCourseAssignment[]> {
    return UserCourseAssignmentsService.getB2BCourseAssignments(userId);
  }

  static async getTeamCourseAssignments(
    userId: string
  ): Promise<TeamCourseAssignment[]> {
    return UserCourseAssignmentsService.getTeamCourseAssignments(userId);
  }

  static async getB2CCoursePurchases(
    userId: string
  ): Promise<B2CCoursePurchase[]> {
    return UserCourseAssignmentsService.getB2CCoursePurchases(userId);
  }

  static async getUserCourses(
    userId: string,
    userType: UserType
  ): Promise<CourseAssignment[]> {
    return UserCourseAssignmentsService.getUserCourses(userId, userType);
  }

  static async getUpcomingDeadlines(
    userId: string,
    daysAhead: number = 14
  ): Promise<B2BCourseAssignment[]> {
    return UserCourseAssignmentsService.getUpcomingDeadlines(
      userId,
      daysAhead
    );
  }

  static async getStudyPreferences(
    userId: string
  ): Promise<StudyPreferences | null> {
    return UserPreferencesService.getStudyPreferences(userId);
  }

  static async getCalendarIntegration(
    userId: string
  ): Promise<CalendarIntegration | null> {
    return UserPreferencesService.getCalendarIntegration(userId);
  }

  /**
   * Obtiene el contexto completo del usuario para el planificador
   */
  static async getFullUserContext(userId: string): Promise<UserContext> {
    const userType = await UserIdentityService.getUserType(userId);

    const [
      user,
      professionalProfile,
      organization,
      workTeams,
      courses,
      studyPreferences,
      calendarIntegration,
    ] = await Promise.all([
      UserIdentityService.getUserBasicInfo(userId),
      UserIdentityService.getUserProfile(userId),
      userType === 'b2b'
        ? UserOrganizationService.getUserOrganization(userId)
        : Promise.resolve(null),
      userType === 'b2b'
        ? UserOrganizationService.getUserWorkTeams(userId)
        : Promise.resolve([]),
      UserCourseAssignmentsService.getUserCourses(userId, userType),
      UserPreferencesService.getStudyPreferences(userId),
      UserPreferencesService.getCalendarIntegration(userId),
    ]);

    return {
      user,
      userType,
      professionalProfile: professionalProfile || undefined,
      organization: organization || undefined,
      workTeams: workTeams.length > 0 ? workTeams : undefined,
      courses,
      studyPreferences: studyPreferences || undefined,
      calendarIntegration: calendarIntegration || undefined,
    };
  }
}
