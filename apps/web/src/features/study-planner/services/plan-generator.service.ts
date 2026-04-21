import { type UserStudyContext, type B2BAssignment } from './user-context.service';
import { type AvailabilityEstimate } from './availability-calculator.service';
import { type LearningRoute } from './learning-route.service';
import { SessionValidatorService } from './session-validator.service';
import { StudyStrategyService, type StudyMode } from './study-strategy.service';
import { generatePlanSessions, formatTime } from './plan-generator-sessions.service';
import type {
  StudyPlanConfig,
  TimeBlock,
  GeneratedPlan,
  PlannedSession,
  SessionBreak,
  PlanSummary,
  B2BValidationResult,
} from './plan-generator.types';

export type { StudyPlanConfig, TimeBlock, GeneratedPlan, PlannedSession, SessionBreak, PlanSummary, B2BValidationResult };

export class PlanGeneratorService {
  static async generatePlan(config: StudyPlanConfig): Promise<GeneratedPlan> {
    const warnings: string[] = [];
    this.validateConfig(config, warnings);

    const sessions = await generatePlanSessions(config);
    const summary = this.calculateSummary(config, sessions);

    let b2bValidation: B2BValidationResult | undefined;
    if (config.userType === 'b2b' && config.assignments && config.assignments.length > 0) {
      b2bValidation = this.validateB2BDeadlines(config, summary);
      if (!b2bValidation.canMeetAllDeadlines) {
        warnings.push('⚠️ Algunos plazos corporativos podrían no cumplirse con la configuración actual.');
      }
    }

    return { config, sessions, summary, warnings, b2bValidation };
  }

  private static validateConfig(config: StudyPlanConfig, warnings: string[]): void {
    if (config.selectedCourseIds.length === 0) warnings.push('No se han seleccionado cursos para el plan.');
    if (config.selectedDays.length === 0) warnings.push('No se han seleccionado días para estudiar.');
    if (config.timeBlocks.length === 0) warnings.push('No se han configurado bloques de tiempo.');
    if (config.minSessionMinutes > config.maxSessionMinutes) warnings.push('El tiempo mínimo es mayor al máximo. Se ajustará automáticamente.');
  }

  private static calculateSummary(config: StudyPlanConfig, sessions: PlannedSession[]): PlanSummary {
    const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalBreakMinutes = sessions.reduce((sum, s) => sum + s.breaks.reduce((b, br) => b + br.durationMinutes, 0), 0);
    const weeksSpanned = sessions.length > 0
      ? Math.ceil((sessions[sessions.length - 1].date.getTime() - sessions[0].date.getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1
      : 1;
    const lessonsPerCourse: Record<string, number> = {};
    sessions.forEach((s) => { lessonsPerCourse[s.courseId] = (lessonsPerCourse[s.courseId] || 0) + 1; });

    return {
      totalSessions: sessions.length,
      totalStudyMinutes,
      totalBreakMinutes,
      sessionsPerWeek: Math.round(sessions.length / weeksSpanned),
      estimatedWeeksToComplete: weeksSpanned,
      estimatedEndDate: sessions.length > 0 ? sessions[sessions.length - 1].date : new Date(config.startDate),
      coursesIncluded: config.selectedCourseIds.length,
      lessonsPerCourse,
    };
  }

  private static validateB2BDeadlines(config: StudyPlanConfig, summary: PlanSummary): B2BValidationResult {
    if (!config.assignments) return { canMeetAllDeadlines: true, deadlineStatus: [] };
    const deadlineStatus: B2BValidationResult['deadlineStatus'] = [];
    let canMeetAllDeadlines = true;

    for (const assignment of config.assignments) {
      if (!assignment.due_date || !config.selectedCourseIds.includes(assignment.course_id)) continue;
      const deadline = new Date(assignment.due_date);
      const canMeet = summary.estimatedEndDate <= deadline;
      if (!canMeet) canMeetAllDeadlines = false;
      deadlineStatus.push({
        courseId: assignment.course_id,
        courseTitle: assignment.course_title,
        deadline,
        canMeet,
        estimatedCompletion: summary.estimatedEndDate,
        daysMargin: Math.ceil((deadline.getTime() - summary.estimatedEndDate.getTime()) / (24 * 60 * 60 * 1000)),
      });
    }

    return { canMeetAllDeadlines, deadlineStatus };
  }

  static createPlanConfig(
    userContext: UserStudyContext,
    availability: AvailabilityEstimate,
    learningRoute: LearningRoute,
    preferences: {
      name?: string;
      selectedDays: string[];
      timeBlocks: TimeBlock[];
      minSessionMinutes: number;
      maxSessionMinutes: number;
      preferredSessionType: 'short' | 'medium' | 'long';
      startDate?: Date;
      targetEndDate?: Date;
      studyMode?: StudyMode;
      maxConsecutiveHours?: number;
      enableSpacedRepetition?: boolean;
    },
  ): StudyPlanConfig {
    const breakSchedule = SessionValidatorService.calculateBreakSchedule(preferences.maxSessionMinutes);

    let studyMode = preferences.studyMode;
    if (!studyMode) {
      const totalMinutes = (availability.weeklyHoursMax * 60) * 4;
      const hasDeadline = userContext.userType === 'b2b' && userContext.assignments?.some((a: B2BAssignment) => a.due_date);
      const daysAvailable = preferences.targetEndDate
        ? Math.ceil((preferences.targetEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;
      studyMode = StudyStrategyService.suggestStudyMode(totalMinutes, daysAvailable, hasDeadline || false).mode;
    }

    return {
      userId: userContext.userId,
      userType: userContext.userType,
      organizationId: userContext.organizationId,
      name: preferences.name || `Plan de Estudio - ${new Date().toLocaleDateString('es-ES')}`,
      selectedCourseIds: learningRoute.items.map((item) => item.courseId),
      learningRoute,
      minSessionMinutes: preferences.minSessionMinutes,
      maxSessionMinutes: preferences.maxSessionMinutes,
      preferredSessionType: preferences.preferredSessionType,
      selectedDays: preferences.selectedDays,
      timeBlocks: preferences.timeBlocks,
      breakSchedule,
      startDate: preferences.startDate || new Date(),
      targetEndDate: preferences.targetEndDate,
      assignments: userContext.assignments,
      studyMode,
      maxConsecutiveHours: preferences.maxConsecutiveHours || 2,
      enableSpacedRepetition: preferences.enableSpacedRepetition || false,
    };
  }
}
