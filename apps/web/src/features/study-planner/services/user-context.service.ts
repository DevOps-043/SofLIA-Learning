/**
 * UserContextService
 *
 * Orchestrates the full user context for the study planner by combining
 * identity, organisation, course assignments, preferences data,
 * and B2B planner configuration.
 */

import { UserIdentityService } from './user-identity.service';
import { UserOrganizationService } from './user-organization.service';
import { UserCourseAssignmentsService } from './user-course-assignments.service';
import { UserPreferencesService } from './user-preferences.service';
import { OrganizationPlannerConfigService } from './organization-planner-config.service';
import type {
  UserType,
  UserContext,
  UserBasicInfo,
  UserProfessionalProfile,
  OrganizationInfo,
  CourseAssignment,
  StudyPreferences,
  CalendarIntegration,
  B2BCourseAssignment,
  B2CCoursePurchase,
  TeamCourseAssignment,
} from '../types/user-context.types';
import type { OrganizationPlannerContext } from '../types/user-context.types';

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
      courses,
      studyPreferences,
      calendarIntegration,
    ] = await Promise.all([
      UserIdentityService.getUserBasicInfo(userId),
      UserIdentityService.getUserProfile(userId),
      userType === 'b2b'
        ? UserOrganizationService.getUserOrganization(userId)
        : Promise.resolve(null),
      UserCourseAssignmentsService.getUserCourses(userId, userType),
      UserPreferencesService.getStudyPreferences(userId),
      UserPreferencesService.getCalendarIntegration(userId),
    ]);

    // Fetch B2B planner config if the user belongs to an organization
    let organizationPlannerContext: OrganizationPlannerContext | undefined;

    if (userType === 'b2b' && organization?.id) {
      const today = new Date();
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(today.getMonth() + 6);

      const [config, holidays] = await Promise.all([
        OrganizationPlannerConfigService.getOrganizationPlannerConfig(organization.id),
        OrganizationPlannerConfigService.getOrganizationHolidays(
          organization.id,
          today,
          sixMonthsLater,
        ),
      ]);

      organizationPlannerContext = { config, holidays };
    }

    return {
      user,
      userType,
      professionalProfile: professionalProfile || undefined,
      organization: organization || undefined,
      courses,
      studyPreferences: studyPreferences || undefined,
      calendarIntegration: calendarIntegration || undefined,
      organizationPlannerContext,
    };
  }
}

