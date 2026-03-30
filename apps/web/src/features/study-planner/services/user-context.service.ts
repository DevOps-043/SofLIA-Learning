/**
 * UserContextService
 *
 * Orchestrates the full user context for the study planner by combining
 * identity, organisation, course-assignments, and preferences data.
 *
 * Sub-services (re-exported for direct use):
 *  - UserIdentityService       → user type, basic info, professional profile
 *  - UserOrganizationService   → organisation info, work teams
 *  - UserCourseAssignmentsService → B2B/B2C assignments, unified courses, deadlines
 *  - UserPreferencesService    → study preferences, calendar integration, learning routes
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
  LearningRoute,
} from '../types/user-context.types';

// Re-export sub-services so existing callers that import from this file keep working
export { UserIdentityService } from './user-identity.service';
export { UserOrganizationService } from './user-organization.service';
export { UserCourseAssignmentsService } from './user-course-assignments.service';
export { UserPreferencesService } from './user-preferences.service';

export class UserContextService {
  // ── Identity ────────────────────────────────────────────────────────────────

  static async getUserType(userId: string): Promise<UserType> {
    return UserIdentityService.getUserType(userId);
  }

  static async getUserBasicInfo(userId: string): Promise<UserBasicInfo> {
    return UserIdentityService.getUserBasicInfo(userId);
  }

  static async getUserProfile(userId: string): Promise<UserProfessionalProfile | null> {
    return UserIdentityService.getUserProfile(userId);
  }

  // ── Organisation ────────────────────────────────────────────────────────────

  static async getUserOrganization(userId: string): Promise<OrganizationInfo | null> {
    return UserOrganizationService.getUserOrganization(userId);
  }

  static async getUserWorkTeams(userId: string): Promise<WorkTeam[]> {
    return UserOrganizationService.getUserWorkTeams(userId);
  }

  // ── Course assignments ───────────────────────────────────────────────────────

  static async getB2BCourseAssignments(userId: string): Promise<B2BCourseAssignment[]> {
    return UserCourseAssignmentsService.getB2BCourseAssignments(userId);
  }

  static async getTeamCourseAssignments(userId: string): Promise<TeamCourseAssignment[]> {
    return UserCourseAssignmentsService.getTeamCourseAssignments(userId);
  }

  static async getB2CCoursePurchases(userId: string): Promise<B2CCoursePurchase[]> {
    return UserCourseAssignmentsService.getB2CCoursePurchases(userId);
  }

  static async getUserCourses(userId: string, userType: UserType): Promise<CourseAssignment[]> {
    return UserCourseAssignmentsService.getUserCourses(userId, userType);
  }

  static async getUpcomingDeadlines(userId: string, daysAhead: number = 14): Promise<B2BCourseAssignment[]> {
    return UserCourseAssignmentsService.getUpcomingDeadlines(userId, daysAhead);
  }

  // ── Preferences ─────────────────────────────────────────────────────────────

  static async getStudyPreferences(userId: string): Promise<StudyPreferences | null> {
    return UserPreferencesService.getStudyPreferences(userId);
  }

  static async getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
    return UserPreferencesService.getCalendarIntegration(userId);
  }

  /** @deprecated La funcionalidad de rutas de aprendizaje ya no existe */
  static async getLearningRoutes(_userId: string): Promise<LearningRoute[]> {
    return UserPreferencesService.getLearningRoutes(_userId);
  }

  // ── Full context (orchestrator) ──────────────────────────────────────────────

  /**
   * Obtiene el contexto completo del usuario para el planificador
   */
  static async getFullUserContext(userId: string): Promise<UserContext> {
    // Obtener tipo de usuario primero
    const userType = await UserIdentityService.getUserType(userId);

    // Obtener datos en paralelo
    const [
      user,
      professionalProfile,
      organization,
      workTeams,
      courses,
      studyPreferences,
      calendarIntegration,
      learningRoutes,
    ] = await Promise.all([
      UserIdentityService.getUserBasicInfo(userId),
      UserIdentityService.getUserProfile(userId),
      userType === 'b2b' ? UserOrganizationService.getUserOrganization(userId) : Promise.resolve(null),
      userType === 'b2b' ? UserOrganizationService.getUserWorkTeams(userId) : Promise.resolve([]),
      UserCourseAssignmentsService.getUserCourses(userId, userType),
      UserPreferencesService.getStudyPreferences(userId),
      UserPreferencesService.getCalendarIntegration(userId),
      UserPreferencesService.getLearningRoutes(userId),
    ]);

    const context = {
      user,
      userType,
      professionalProfile: professionalProfile || undefined,
      organization: organization || undefined,
      workTeams: workTeams.length > 0 ? workTeams : undefined,
      courses,
      studyPreferences: studyPreferences || undefined,
      calendarIntegration: calendarIntegration || undefined,
      learningRoutes: learningRoutes.length > 0 ? learningRoutes : undefined,
    };

    return context;
  }
}
