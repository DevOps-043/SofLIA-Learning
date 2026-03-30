/**
 * lia-context-builder.service.ts
 *
 * Builds the full StudyPlannerContext for SofLIA by aggregating user data,
 * course progress, calendar availability, and preferences.
 */

import { UserContextService } from './user-context.service';
import { CalendarIntegrationService } from './calendar-integration.service';
import { LiaCourseAnalysisService } from './lia-course-analysis.service';
import { getWorkshopMetadata } from '../../../lib/utils/workshop-metadata';
import { createClient } from '../../../lib/supabase/server';
import { CourseAnalysisService } from './course-analysis.service';
import type { UserContext } from '../types/user-context.types';
import type { StudyPlannerContext } from './lia-context.types';

export class LiaContextBuilderService {
  /**
   * Construye el contexto completo para SofLIA del planificador
   */
  static async buildStudyPlannerContext(userId: string): Promise<StudyPlannerContext> {
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(userId);


    // Construir contexto base
    const context: StudyPlannerContext = {
      userType: userContext.userType,
      userProfile: this.formatUserProfile(userContext),
      courses: await this.formatCourses(userId, userContext),
      calendarConnected: !!userContext.calendarIntegration?.isConnected,
      calendarProvider: userContext.calendarIntegration?.provider,
    };


    // Agregar información de organización para B2B
    if (userContext.userType === 'b2b' && userContext.organization) {
      context.organization = {
        name: userContext.organization.name,
        size: userContext.organization.size,
        industry: userContext.organization.industry,
      };

      if (userContext.workTeams && userContext.workTeams.length > 0) {
        context.workTeams = userContext.workTeams.map(team => ({
          name: team.name,
          role: team.role,
        }));
      }

      // Obtener plazos próximos
      const deadlines = await UserContextService.getUpcomingDeadlines(userId, 30);
      if (deadlines.length > 0) {
        context.upcomingDeadlines = deadlines.map(d => ({
          courseTitle: d.course.title,
          dueDate: d.dueDate!,
          daysRemaining: Math.ceil(
            (new Date(d.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
          completionPercentage: d.completionPercentage,
        }));
      }
    }

    // Análisis de cursos
    if (context.courses.length > 0) {
      context.courseAnalysis = await LiaCourseAnalysisService.analyzeCourses(userId, context.courses);
    }

    // Información del calendario
    if (context.calendarConnected) {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const events = await CalendarIntegrationService.getCalendarEvents(
        userId,
        startDate,
        endDate
      );

      if (events.length > 0) {
        context.calendarEvents = events;

        const availability = CalendarIntegrationService.analyzeAvailability(
          events,
          startDate,
          endDate
        );

        let totalFree = 0;
        let totalBusy = 0;
        let totalSlots = 0;

        for (const day of availability) {
          totalFree += day.totalFreeMinutes;
          totalBusy += day.totalBusyMinutes;
          totalSlots += day.freeSlots.length;
        }

        context.calendarAvailability = {
          totalFreeMinutes: totalFree,
          totalBusyMinutes: totalBusy,
          averageFreeMinutesPerDay: availability.length > 0
            ? Math.round(totalFree / availability.length)
            : 0,
          freeSlotCount: totalSlots,
        };
      }
    }

    // Preferencias existentes
    if (userContext.studyPreferences) {
      context.existingPreferences = {
        timezone: userContext.studyPreferences.timezone,
        preferredTimeOfDay: userContext.studyPreferences.preferredTimeOfDay,
        preferredDays: userContext.studyPreferences.preferredDays,
        weeklyTargetMinutes: userContext.studyPreferences.weeklyTargetMinutes,
      };
    }

    return context;
  }

  /**
   * Formatea el perfil del usuario para SofLIA
   */
  private static formatUserProfile(userContext: UserContext): StudyPlannerContext['userProfile'] {
    return {
      nombre: userContext.user.displayName ||
        (userContext.user.firstName && userContext.user.lastName
          ? `${userContext.user.firstName} ${userContext.user.lastName}`
          : undefined),
      rol: userContext.professionalProfile?.rol?.nombre,
      area: userContext.professionalProfile?.area?.nombre,
      nivel: userContext.professionalProfile?.nivel?.nombre,
      sector: userContext.professionalProfile?.sector?.nombre,
      tamanoEmpresa: userContext.professionalProfile?.tamanoEmpresa?.nombre,
      minEmpleados: userContext.professionalProfile?.tamanoEmpresa?.minEmpleados,
      maxEmpleados: userContext.professionalProfile?.tamanoEmpresa?.maxEmpleados,
    };
  }

  /**
   * Formatea los cursos para SofLIA
   */
  private static async formatCourses(
    userId: string,
    userContext: UserContext
  ): Promise<StudyPlannerContext['courses']> {
    const formattedCourses: StudyPlannerContext['courses'] = [];
    const supabase = await createClient();

    for (const courseAssignment of userContext.courses) {
      const progress = await CourseAnalysisService.getUserCourseProgress(
        userId,
        courseAssignment.courseId
      );

      // Usar getWorkshopMetadata para obtener módulos y lecciones (misma lógica que /learn)
      const workshopMetadata = await getWorkshopMetadata(courseAssignment.courseId);

      // Obtener lecciones completadas del usuario
      const { data: completedLessonsData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('is_completed', true);

      const completedLessonIds = new Set((completedLessonsData || []).map((l: { lesson_id: string }) => l.lesson_id));

      // Formatear módulos y lecciones usando los datos del workshopMetadata
      const formattedModules = workshopMetadata?.modules.map(module => ({
        moduleId: module.moduleId,
        moduleTitle: module.moduleTitle,
        moduleOrderIndex: module.moduleOrderIndex,
        lessons: module.lessons.map(lesson => ({
          lessonId: lesson.lessonId,
          lessonTitle: lesson.lessonTitle,
          lessonOrderIndex: lesson.lessonOrderIndex,
          // ✅ CORRECCIÓN: Usar totalDurationMinutes que ya está correctamente calculado en workshop-metadata.ts
          // Prioridad: totalDurationMinutes > durationSeconds/60 > 15 (fallback)
          durationMinutes: lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0
            ? lesson.totalDurationMinutes
            : (lesson.durationSeconds && lesson.durationSeconds > 0
              ? Math.ceil(lesson.durationSeconds / 60)
              : 15),
          isCompleted: completedLessonIds.has(lesson.lessonId),
        })),
      })) || [];

      formattedCourses.push({
        id: courseAssignment.courseId,
        title: courseAssignment.course.title,
        category: courseAssignment.course.category,
        level: courseAssignment.course.level,
        durationMinutes: courseAssignment.course.durationTotalMinutes,
        completionPercentage: progress.progressPercentage,
        dueDate: courseAssignment.dueDate,
        assignedBy: courseAssignment.assignedBy,
        modules: formattedModules,
      });
    }

    return formattedCourses;
  }
}
