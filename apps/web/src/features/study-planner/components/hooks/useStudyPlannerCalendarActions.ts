'use client';

import { useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { calculateStudyPlannerEstimatedAvailability } from '../../services/planner-calendar-analysis.service';
import { analyzeStudyPlannerSlotCalendar } from '../../services/planner-slot-analysis.service';
import { selectStudyPlannerFinalSlots } from '../../services/planner-slot-selection.service';
import { resolveStudyPlannerTargetWindow } from '../../services/planner-target-window.service';
import { calculateStudyPlannerWeeklyGoals } from '../../services/planner-weekly-goals.service';
import { calculateStudyPlannerTotalLessonsNeeded } from '../../services/planner-course-workload.service';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarFreeSlotWithDay,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';

export interface UseStudyPlannerCalendarActionsParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: StudyPlannerCalendarProvider;
  isAudioEnabled: boolean;
  isProcessing: boolean;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  pendingLessonsWithNames: StudyPlannerPendingLesson[];
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  selectedCourseIds: string[];
  setConnectedCalendar: Dispatch<SetStateAction<StudyPlannerCalendarProvider>>;
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setIsConnectingCalendar: Dispatch<SetStateAction<boolean>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setPendingLessonsWithNames: Dispatch<SetStateAction<StudyPlannerPendingLesson[]>>;
  setSavedCalendarData: Dispatch<SetStateAction<StudyPlannerCalendarDataMap | null>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setSavedTargetDate: Dispatch<SetStateAction<string | null>>;
  setSavedTotalLessons: Dispatch<SetStateAction<number>>;
  setSelectedCourseIds: Dispatch<SetStateAction<string[]>>;
  setShowCalendarModal: Dispatch<SetStateAction<boolean>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
  setUserContext: Dispatch<SetStateAction<StudyPlannerUserContext | null>>;
  speakText: (text: string) => Promise<void>;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
  userId: string | undefined;
}

export function useStudyPlannerCalendarActions({
  availableCourses,
  assignedCourses,
  connectedCalendar,
  isAudioEnabled,
  isProcessing,
  pendingLessonsRef,
  pendingLessonsWithNames,
  selectedCourseIds,
  setConnectedCalendar,
  setConversationHistory,
  setIsConnectingCalendar,
  setIsProcessing,
  setPendingLessonsWithNames,
  setSavedCalendarData,
  setSavedLessonDistribution,
  setSavedTargetDate,
  setSavedTotalLessons,
  setSelectedCourseIds,
  setShowCalendarModal,
  setTargetDate,
  setUserContext,
  speakText,
  studyApproach,
  targetDate,
  userContext,
  userId,
}: UseStudyPlannerCalendarActionsParams) {
  // Use a ref so that analyzeCalendarAndSuggestB2B can call analyzeCalendarAndSuggest
  // without a forward-reference problem, since both are defined in the same scope below.
  const analyzeCalendarAndSuggestRef = useRef<(
    provider: string,
    targetDateParam?: string,
    approachParam?: StudyApproach | null,
    skipB2BRedirect?: boolean
  ) => Promise<void>>(async () => {});

  const analyzeCalendarAndSuggestB2B = async (
    provider: string,
    approach: StudyApproach,
    userProfile: any,
    assignedCoursesParam: Array<{ courseId: string; title: string; dueDate: string | null }>
  ) => {
    setIsProcessing(true);

    try {
      const allDueDates = assignedCoursesParam
        .map(c => c.dueDate)
        .filter(Boolean)
        .map(d => new Date(d!))
        .sort((a, b) => b.getTime() - a.getTime());

      let furthestDueDate = allDueDates[0];
      let nearestDueDate = allDueDates[allDueDates.length - 1];

      if (!furthestDueDate) {
        const weeksToAdd = approach === 'corto' ? 2 : (approach === 'balance' ? 4 : 8);
        furthestDueDate = new Date();
        furthestDueDate.setDate(furthestDueDate.getDate() + (weeksToAdd * 7));
        nearestDueDate = furthestDueDate;
      }

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(furthestDueDate);
      endDate.setHours(23, 59, 59, 999);

      let calendarEvents: any[] = [];
      try {
        const eventsResponse = await fetch(
          `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          calendarEvents = eventsData.events || [];
        }
      } catch (error) {
        console.error('[B2B] Error obteniendo eventos:', error);
      }

      const courseAnalysis = await Promise.all(
        assignedCoursesParam.map(async (course) => {
          const effectiveDueDate = course.dueDate ? new Date(course.dueDate) : furthestDueDate;
          const courseDueDate = effectiveDueDate;
          const daysUntilDeadline = Math.ceil((courseDueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksUntilDeadline = Math.ceil(daysUntilDeadline / 7);

          let totalLessons = 0;
          let completedLessons = 0;

          try {
            const metadataResponse = await fetch(`/api/workshops/${course.courseId}/metadata`);

            if (metadataResponse.ok) {
              const metadataData = await metadataResponse.json();

              const modules = metadataData.metadata?.modules || metadataData.modules || [];

              if (modules && modules.length > 0) {
                const allLessons = modules.flatMap((module: any) => {
                  if (!module.lessons || !Array.isArray(module.lessons)) {
                    return [];
                  }
                  return module.lessons.map((lesson: any) => ({
                    lessonId: lesson.lessonId,
                    lessonTitle: lesson.lessonTitle,
                  }));
                });

                const uniqueLessonsMap = new Map<string, any>();
                allLessons.forEach((lesson: any) => {
                  if (lesson && lesson.lessonId) {
                    if (!uniqueLessonsMap.has(lesson.lessonId)) {
                      uniqueLessonsMap.set(lesson.lessonId, lesson);
                    }
                  }
                });

                const publishedLessons = Array.from(uniqueLessonsMap.values());
                totalLessons = publishedLessons.length || 0;

                let completedLessonIds: string[] = [];
                try {
                  const progressResponse = await fetch(
                    `/api/study-planner/course-progress?courseId=${course.courseId}`
                  );
                  if (progressResponse.ok) {
                    const progressData = await progressResponse.json();
                    completedLessonIds = progressData.completedLessonIds || [];
                    completedLessons = completedLessonIds.length;
                  } else {
                    console.warn(`[B2B] No se pudo obtener progreso del curso ${course.courseId}`);
                  }
                } catch (progressError) {
                  console.warn(`[B2B] Error obteniendo progreso del curso ${course.courseId}:`, progressError);
                }

                const completedSet = new Set(completedLessonIds);
                const pendingLessonsDetails: Array<{
                  lessonId: string;
                  lessonTitle: string;
                  moduleTitle: string;
                  moduleOrderIndex: number;
                  lessonOrderIndex: number;
                  durationSeconds: number;
                  totalDurationMinutes: number;
                }> = [];

                modules.forEach((module: any, moduleIdx: number) => {
                  if (!module.lessons || !Array.isArray(module.lessons)) return;

                  module.lessons.forEach((lesson: any, lessonIdx: number) => {
                    if (!completedSet.has(lesson.lessonId)) {
                      pendingLessonsDetails.push({
                        lessonId: lesson.lessonId,
                        lessonTitle: lesson.lessonTitle || `Lección ${lessonIdx + 1}`,
                        moduleTitle: module.moduleTitle || `Módulo ${moduleIdx + 1}`,
                        moduleOrderIndex: module.moduleOrderIndex || moduleIdx,
                        lessonOrderIndex: lesson.lessonOrderIndex || lessonIdx,
                        durationSeconds: lesson.durationSeconds || 0,
                        totalDurationMinutes: lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0
                          ? lesson.totalDurationMinutes
                          : (lesson.durationSeconds && lesson.durationSeconds > 0
                            ? Math.ceil(lesson.durationSeconds / 60)
                            : 15)
                      });
                    }
                  });
                });

                pendingLessonsDetails.sort((a, b) => {
                  if (a.moduleOrderIndex !== b.moduleOrderIndex) {
                    return a.moduleOrderIndex - b.moduleOrderIndex;
                  }
                  return a.lessonOrderIndex - b.lessonOrderIndex;
                });

                return {
                  courseId: course.courseId,
                  title: course.title,
                  dueDate: course.dueDate || courseDueDate.toISOString(),
                  dueDateObj: courseDueDate,
                  daysUntilDeadline,
                  weeksUntilDeadline,
                  totalLessons,
                  completedLessons,
                  pendingLessons: totalLessons - completedLessons,
                  pendingLessonsDetails,
                };

              } else {
                console.warn(`[B2B] No se encontraron módulos en metadata para curso ${course.courseId}`);
              }
            } else {
              console.warn(`[B2B] No se pudo obtener metadata del curso ${course.courseId}`);
            }
          } catch (error) {
            console.warn(`[B2B] Error obteniendo lecciones del curso ${course.courseId}:`, error);
          }

          const pendingLessons = totalLessons - completedLessons;

          return {
            courseId: course.courseId,
            title: course.title,
            dueDate: course.dueDate || courseDueDate.toISOString(),
            dueDateObj: courseDueDate,
            daysUntilDeadline,
            weeksUntilDeadline,
            totalLessons,
            completedLessons,
            pendingLessons,
            pendingLessonsDetails: [],
          };
        })
      );

      const validCourseAnalysis = courseAnalysis.filter(c => c !== null) as Array<NonNullable<typeof courseAnalysis[0]>>;

      const allPendingLessons: StudyPlannerPendingLesson[] = [];
      validCourseAnalysis.forEach(courseInfo => {
        if (courseInfo.pendingLessonsDetails && courseInfo.pendingLessonsDetails.length > 0) {
          courseInfo.pendingLessonsDetails.forEach(lesson => {
            allPendingLessons.push({
              courseId: courseInfo.courseId,
              courseTitle: courseInfo.title,
              lessonId: lesson.lessonId,
              lessonTitle: lesson.lessonTitle,
              moduleTitle: lesson.moduleTitle,
              moduleOrderIndex: lesson.moduleOrderIndex,
              lessonOrderIndex: lesson.lessonOrderIndex,
              durationMinutes: lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0 ? lesson.totalDurationMinutes : 15,
            });
          });
        }
      });

      allPendingLessons.sort((a, b) => {
        if (a.moduleOrderIndex !== b.moduleOrderIndex) {
          return a.moduleOrderIndex - b.moduleOrderIndex;
        }
        return a.lessonOrderIndex - b.lessonOrderIndex;
      });

      setPendingLessonsWithNames(allPendingLessons);
      pendingLessonsRef.current = allPendingLessons;

      const originalSelectedCourseIds = selectedCourseIds;
      const b2bCourseIds = validCourseAnalysis.map(c => c.courseId);
      setSelectedCourseIds(b2bCourseIds);

      const nearestDueDateFormatted = nearestDueDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      setTargetDate(nearestDueDateFormatted);

      try {
        await analyzeCalendarAndSuggestRef.current(
          provider,
          nearestDueDateFormatted,
          approach,
          true
        );
      } catch (innerError) {
        console.error('[B2B] Error interno en analyzeCalendarAndSuggest:', innerError);
        throw innerError;
      } finally {
        setIsProcessing(false);
      }

      setSelectedCourseIds(originalSelectedCourseIds);

    } catch (error) {
      console.error('[B2B] Error en análisis de calendario:', error);
      setIsProcessing(false);

      const errorMsg = `Tu calendario está conectado, pero no pude completar el análisis automático.\n\nNo te preocupes, podemos continuar de forma manual. **¿Qué días de la semana prefieres estudiar?** ¿Y en qué horario te concentras mejor: **mañana**, **tarde** o **noche**?`;
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    }
  };

  const analyzeCalendarAndSuggest = async (
    provider: string,
    targetDateParam?: string,
    approachParam?: StudyApproach | null,
    skipB2BRedirect?: boolean
  ) => {
    const effectiveApproach = approachParam !== undefined ? approachParam : studyApproach;
    const effectiveTargetDate = targetDateParam || targetDate;

    if (isProcessing) {
      console.warn('[analyzeCalendarAndSuggest] Se llamó mientras estaba procesando. Continuando de todos modos para asegurar recuperación...');
    }

    setTimeout(() => {
      setIsProcessing(false);
    }, 45000);

    const approachToUse = effectiveApproach || approachParam;
    if (!approachToUse) {
      setIsProcessing(false);
      return;
    }

    const hasAssignedCoursesWithDueDate = assignedCourses.some(c => c.dueDate);

    let dateToUse = effectiveTargetDate;
    if (!dateToUse && hasAssignedCoursesWithDueDate) {
      const nearestCourse = assignedCourses.find(c => c.dueDate);
      if (nearestCourse && nearestCourse.dueDate) {
        const dueDateObj = new Date(nearestCourse.dueDate);
        dateToUse = dueDateObj.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    }

    if (!dateToUse) {
      const weeksToAdd = approachToUse === 'corto' ? 2 : (approachToUse === 'balance' ? 4 : 8);
      const defaultTargetDate = new Date();
      defaultTargetDate.setDate(defaultTargetDate.getDate() + (weeksToAdd * 7));
      dateToUse = defaultTargetDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    setIsProcessing(true);

    try {
      const contextResponse = await fetch('/api/study-planner/user-context');
      let userProfile: any = null;

      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        if (contextData.success && contextData.data) {
          userProfile = contextData.data;

          setUserContext({
            userType: userProfile.userType || null,
            userName: userProfile.user?.firstName || userProfile.user?.displayName || userProfile.user?.username || null,
            rol: userProfile.professionalProfile?.rol?.nombre || null,
            area: userProfile.professionalProfile?.area?.nombre || null,
            nivel: userProfile.professionalProfile?.nivel?.nombre || null,
            tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
            organizationName: userProfile.organization?.name || null,
            minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
            maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
            workTeams: userProfile.workTeams?.map((team: any) => ({
              name: team.name || 'Equipo',
              role: team.role || 'member'
            })) || null,
          });

          if (userProfile.userType === 'b2b' && assignedCourses.length > 0 && !skipB2BRedirect) {
            await analyzeCalendarAndSuggestB2B(
              provider,
              effectiveApproach!,
              userProfile,
              assignedCourses
            );
            return;
          }
        }
      }

      const targetWindow = resolveStudyPlannerTargetWindow({
        targetDate: effectiveTargetDate,
        studyApproach: effectiveApproach,
      });
      const targetDateObjForEvents = targetWindow.targetDateObj;

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      const currentTime = new Date();

      let endDate = new Date();
      if (targetDateObjForEvents) {
        endDate = new Date(targetDateObjForEvents);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate.setDate(endDate.getDate() + 30);
      }

      let calendarEvents: any[] = [];

      try {
        const eventsResponse = await fetch(
          `/api/study-planner/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          calendarEvents = eventsData.events || [];
        } else {
          let errorData: any = {};
          try {
            errorData = await eventsResponse.json();
          } catch (jsonError) {
            try {
              const errorText = await eventsResponse.text();
              errorData = { error: errorText };
            } catch (textError) {
              errorData = { error: 'Error desconocido al obtener respuesta' };
            }
          }

          console.error('Error en respuesta de eventos:', eventsResponse.status, errorData);

          if (eventsResponse.status === 401 && errorData.requiresReconnection) {
            console.warn('Token expirado y no se pudo refrescar. Se requiere reconexión del calendario.');
            setConnectedCalendar(null);

            const reconnectMsg = `Tu conexión con el calendario ha expirado. Por favor, reconecta tu calendario para continuar.`;
            setConversationHistory(prev => [...prev, {
              role: 'assistant',
              content: reconnectMsg
            }]);

            setTimeout(() => {
              setShowCalendarModal(true);
            }, 1000);

            calendarEvents = [];
          } else {
            calendarEvents = [];
            console.warn('No se pudieron obtener eventos del calendario, continuando sin análisis de disponibilidad');
          }
        }
      } catch (calError) {
        console.error('Error obteniendo eventos:', calError);
        calendarEvents = [];
      }

      const {
        adjustedTargetDate,
        bufferDays,
        targetDateObj,
        weeksUntilTarget,
      } = targetWindow;

      const {
        avgFreeHoursPerDay,
        busiestDays,
        calendarDataToSave,
        daysAnalysis,
        daysWithFreeTime,
        profileAvailability,
      } = analyzeStudyPlannerSlotCalendar({
        calendarEvents,
        currentTime,
        effectiveApproach,
        effectiveTargetDate,
        startDate,
        targetDateObjForEvents,
        userProfile,
      });

      setSavedCalendarData(calendarDataToSave);

      const totalLessonsNeeded = selectedCourseIds.length > 0
        ? await calculateStudyPlannerTotalLessonsNeeded({ selectedCourseIds })
        : 0;

      const { finalSlots, weeklyAvailableMinutes } = selectStudyPlannerFinalSlots({
        currentTime,
        daysAnalysis,
        hasOrganizationalDeadlines: Array.isArray(userProfile?.courses)
          && userProfile.courses.some((course: { dueDate?: string | null }) => course.dueDate),
        profileAvailability,
        skipB2BRedirect,
        startDate,
        studyApproach: effectiveApproach,
        targetWindow,
        totalLessonsNeeded,
        userType: userContext?.userType || userProfile?.userType || null,
      });

      const weeklyGoals = selectedCourseIds.length > 0 && weeklyAvailableMinutes > 0 && effectiveApproach && weeksUntilTarget > 0 && totalLessonsNeeded > 0
        ? await calculateStudyPlannerWeeklyGoals({
          selectedCourseIds,
          weeklyAvailableMinutes,
          recommendedSessionLength: profileAvailability?.recommendedSessionLength || 60,
          weeksUntilTarget,
          totalLessonsNeeded,
          availableCourses,
        })
        : null;

      if (!weeklyGoals) {
        console.warn('No se pudieron calcular las metas semanales. Verificar condiciones.');
        console.warn(`   Condiciones: selectedCourseIds=${selectedCourseIds.length > 0}, weeklyAvailableMinutes=${weeklyAvailableMinutes > 0}, studyApproach=${!!effectiveApproach}, weeksUntilTarget=${weeksUntilTarget > 0}, totalLessonsNeeded=${totalLessonsNeeded > 0}`);
      }

      const rol = userProfile?.professionalProfile?.rol?.nombre;
      const nivel = userProfile?.professionalProfile?.nivel?.nombre;
      const area = userProfile?.professionalProfile?.area?.nombre;
      const isB2B = userProfile?.userType === 'b2b';
      const orgName = userProfile?.organization?.name;

      let calendarMessage = '';

      if (calendarEvents.length > 0) {
        const introParts: string[] = [];
        introParts.push(`¡Perfecto! Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} está conectado.`);
        introParts.push(`He analizado tu perfil profesional y tu calendario.`);

        if (rol || nivel || area) {
          const profileDesc: string[] = [];
          if (isB2B && orgName) {
            profileDesc.push(`trabajas en ${orgName}`);
          } else {
            profileDesc.push(`eres profesional independiente`);
          }
          if (rol) profileDesc.push(`como ${rol}`);
          if (area) profileDesc.push(`en el área de ${area}`);
          if (profileDesc.length > 0) {
            introParts.push(`Veo que ${profileDesc.join(' ')}.`);
          }
        }

        if (calendarEvents.length > 0) {
          introParts.push(`\n📅 He encontrado múltiples eventos en tu calendario durante el próximo mes.`);
          if (busiestDays.length > 0) {
            introParts.push(`Tus días más ocupados son: ${busiestDays.join(', ')}.`);
          }
        }

        calendarMessage = introParts.join(' ') + '\n\n';

        if (finalSlots.length > 0) {
          const recommendationIntro: string[] = [];
          recommendationIntro.push(`**MIS RECOMENDACIONES:**`);
          recommendationIntro.push(`\n`);

          if (profileAvailability) {
            const sessionLengthText = profileAvailability.recommendedSessionLength >= 60
              ? `${Math.floor(profileAvailability.recommendedSessionLength / 60)} hora${Math.floor(profileAvailability.recommendedSessionLength / 60) > 1 ? 's' : ''}`
              : `${profileAvailability.recommendedSessionLength} minutos`;

            const approachText = effectiveApproach === 'corto' ? 'terminar rápido' : effectiveApproach === 'balance' ? 'ritmo equilibrado' : effectiveApproach === 'largo' ? 'tomarte tu tiempo' : 'sesiones';
            const targetDateText = effectiveTargetDate ? ` y tu objetivo de completar los cursos para ${effectiveTargetDate}` : '';

            recommendationIntro.push(`En base a tu perfil${rol ? ` como ${rol}` : ''}${nivel ? ` (${nivel})` : ''} y tu preferencia por **${approachText}**${targetDateText}, estimo que puedes dedicar aproximadamente ${Math.round(profileAvailability.minutesPerDay / 60 * 10) / 10} hora${profileAvailability.minutesPerDay >= 120 ? 's' : ''} al día para estudiar.`);

            if (effectiveTargetDate && effectiveApproach) {
              recommendationIntro.push(`He distribuido las sesiones de estudio hasta ${effectiveTargetDate} para asegurar que completes tus cursos a tiempo.`);
            }

            recommendationIntro.push(`He analizado tu calendario y encontré que estos son los días con menos eventos.`);
            recommendationIntro.push(`Te propongo estos horarios específicos para sesiones de ${sessionLengthText}${profileAvailability.recommendedBreak > 0 ? ` con descansos de ${profileAvailability.recommendedBreak} minutos` : ''}:`);
            recommendationIntro.push(`\n`);
          } else {
            recommendationIntro.push(`Basándome en los espacios libres que encontré en tu calendario, te sugiero estas sesiones de estudio:`);
            recommendationIntro.push(`\n`);
          }

          calendarMessage += recommendationIntro.join(' ');

          let allLessonsByCourse: Map<string, Array<{ lessonId: string; lessonTitle: string; lessonOrderIndex: number; durationSeconds: number; moduleOrderIndex?: number; totalDurationMinutes?: number }>> = new Map();
          let completedLessonIdsByCourse: Map<string, string[]> = new Map();

          const cachedPendingLessons = pendingLessonsRef.current || pendingLessonsWithNames;

          if (cachedPendingLessons && cachedPendingLessons.length > 0) {

            cachedPendingLessons.forEach(lesson => {
              const currentLessons = allLessonsByCourse.get(lesson.courseId) || [];
              currentLessons.push({
                lessonId: lesson.lessonId,
                lessonTitle: lesson.lessonTitle,
                lessonOrderIndex: lesson.lessonOrderIndex,
                durationSeconds: (lesson.durationMinutes || 15) * 60,
                moduleOrderIndex: lesson.moduleOrderIndex,
                totalDurationMinutes: lesson.durationMinutes
              });
              allLessonsByCourse.set(lesson.courseId, currentLessons);
            });

            selectedCourseIds.forEach(courseId => {
              completedLessonIdsByCourse.set(courseId, []);
            });

          } else if (selectedCourseIds.length > 0) {
            try {
              const myCoursesResponse = await fetch('/api/my-courses');
              if (myCoursesResponse.ok) {
                const myCoursesData = await myCoursesResponse.json();
                const courses = Array.isArray(myCoursesData) ? myCoursesData : (myCoursesData.courses || []);

                await Promise.all(selectedCourseIds.map(async (courseId) => {
                  const courseData = courses.find((c: any) => (c.course_id || c.id) === courseId);
                  if (courseData) {
                    try {
                      const metadataResponse = await fetch(`/api/workshops/${courseId}/metadata`);

                      if (metadataResponse.ok) {
                        const metadataData = await metadataResponse.json();
                        if (metadataData.success && metadataData.metadata && metadataData.metadata.modules && Array.isArray(metadataData.metadata.modules)) {
                          const allLessons = metadataData.metadata.modules.flatMap((module: any) => {
                            if (!module.lessons || !Array.isArray(module.lessons)) {
                              return [];
                            }
                            return module.lessons.map((lesson: any) => {
                              if (!lesson.lessonId || !lesson.lessonTitle || typeof lesson.lessonTitle !== 'string') {
                                console.warn(`   Lección inválida en módulo ${module.moduleId}:`, lesson);
                                return null;
                              }
                              const orderIndex = lesson.lessonOrderIndex && lesson.lessonOrderIndex > 0
                                ? lesson.lessonOrderIndex
                                : 0;

                              return {
                                lessonId: lesson.lessonId,
                                lessonTitle: lesson.lessonTitle.trim(),
                                lessonOrderIndex: orderIndex,
                                moduleOrderIndex: module.moduleOrderIndex || 0,
                                durationSeconds: lesson.durationSeconds || 0,
                                totalDurationMinutes: lesson.totalDurationMinutes
                              };
                            }).filter((lesson: any) => lesson !== null);
                          });

                          const uniqueLessonsMap = new Map<string, any>();
                          allLessons.forEach((lesson: any) => {
                            if (lesson && lesson.lessonId) {
                              if (!uniqueLessonsMap.has(lesson.lessonId)) {
                                uniqueLessonsMap.set(lesson.lessonId, lesson);
                              } else {
                                console.warn(`   Lección duplicada detectada en API: ${lesson.lessonId} - ${lesson.lessonTitle}`);
                              }
                            }
                          });
                          const uniqueLessons = Array.from(uniqueLessonsMap.values());

                          const publishedLessons = uniqueLessons
                            .filter((lesson: any) => {
                              const isValid = lesson &&
                                lesson.lessonId &&
                                lesson.lessonTitle &&
                                typeof lesson.lessonTitle === 'string' &&
                                lesson.lessonTitle.trim() !== '' &&
                                lesson.lessonOrderIndex >= 0;
                              if (!isValid) {
                                console.warn(`   Lección filtrada por datos inválidos:`, lesson);
                              }
                              return isValid;
                            })
                            .sort((a: any, b: any) => {
                              if (a.moduleOrderIndex !== b.moduleOrderIndex) {
                                return a.moduleOrderIndex - b.moduleOrderIndex;
                              }
                              return a.lessonOrderIndex - b.lessonOrderIndex;
                            });

                          allLessonsByCourse.set(courseId, publishedLessons);

                          try {
                            if (userId) {
                              const progressResponse = await fetch(
                                `/api/study-planner/course-progress?courseId=${courseId}`
                              );
                              if (progressResponse.ok) {
                                const progressData = await progressResponse.json();
                                completedLessonIdsByCourse.set(courseId, progressData.completedLessonIds || []);
                              } else {
                                completedLessonIdsByCourse.set(courseId, []);
                              }
                            } else {
                              console.warn(`   No se pudo obtener userId para curso ${courseId}`);
                            }
                          } catch (e) {
                            console.warn(`Error obteniendo progreso para curso ${courseId}:`, e);
                          }
                        }
                      } else {
                        console.warn(`Error obteniendo metadata del curso ${courseId}:`, metadataResponse.status);
                      }
                    } catch (e) {
                      console.warn(`Error obteniendo lecciones del curso ${courseId}:`, e);
                    }
                  } else {
                    console.warn(`Curso ${courseId} no encontrado en mis cursos`);
                  }
                }));
              } else {
                console.warn('Error obteniendo mis cursos:', myCoursesResponse.status);
              }
            } catch (e) {
              console.warn('Error obteniendo cursos para distribución de lecciones:', e);
            }
          }

          const allPendingLessons: Array<{
            courseId: string;
            courseTitle: string;
            lessonId: string;
            lessonTitle: string;
            lessonOrderIndex: number;
            moduleOrderIndex: number;
            durationSeconds: number;
            durationMinutes: number;
          }> = [];

          const addedLessonIds = new Set<string>();

          selectedCourseIds.forEach(courseId => {
            const courseFromList = availableCourses.find(c => c.id === courseId);
            const courseTitle = courseFromList?.title || 'Curso';
            const lessons = allLessonsByCourse.get(courseId) || [];
            const completedIds = completedLessonIdsByCourse.get(courseId) || [];

            let pendingCount = 0;
            let skippedCount = 0;
            let duplicateCount = 0;
            let completedCount = 0;

            lessons.forEach((lesson: any) => {
              if (!lesson || !lesson.lessonTitle || !lesson.lessonId) {
                skippedCount++;
                return;
              }

              if (addedLessonIds.has(lesson.lessonId)) {
                duplicateCount++;
                return;
              }

              if (completedIds.includes(lesson.lessonId)) {
                completedCount++;
                return;
              }

              addedLessonIds.add(lesson.lessonId);

              const baseDuration = lesson.totalDurationMinutes && lesson.totalDurationMinutes > 0
                ? lesson.totalDurationMinutes
                : (lesson.durationSeconds && lesson.durationSeconds > 0
                  ? Math.ceil(lesson.durationSeconds / 60)
                  : 15);

              allPendingLessons.push({
                courseId,
                courseTitle,
                lessonId: lesson.lessonId,
                lessonTitle: lesson.lessonTitle,
                lessonOrderIndex: lesson.lessonOrderIndex || 0,
                moduleOrderIndex: lesson.moduleOrderIndex || 0,
                durationSeconds: lesson.durationSeconds || 0,
                durationMinutes: baseDuration,
              });
              pendingCount++;
            });
          });

          allPendingLessons.sort((a, b) => {
            if (a.courseId !== b.courseId) {
              const courseIdxA = selectedCourseIds.indexOf(a.courseId);
              const courseIdxB = selectedCourseIds.indexOf(b.courseId);
              if (courseIdxA !== courseIdxB) return courseIdxA - courseIdxB;
            }
            if (a.moduleOrderIndex !== b.moduleOrderIndex) {
              return a.moduleOrderIndex - b.moduleOrderIndex;
            }
            return a.lessonOrderIndex - b.lessonOrderIndex;
          });

          const validPendingLessons = allPendingLessons.filter(lesson =>
            lesson && lesson.lessonTitle && lesson.lessonTitle.trim() !== '' && lesson.lessonId
          );

          const approachMultiplier = effectiveApproach === 'corto' ? 0.8
            : effectiveApproach === 'largo' ? 1.2
              : 1.0;

          type LessonGroup = {
            lessons: typeof validPendingLessons;
            totalDuration: number;
            primaryLessonTitle: string;
          };

          const lessonGroups: LessonGroup[] = [];
          const processedIndices = new Set<number>();

          const extractLessonNumber = (title: string): string | null => {
            const match = title.match(/Lecci[oó]n\s+(\d+(?:\.\d+)?)/i);
            return match ? match[1] : null;
          };

          const areLessonsGrouped = (title1: string, title2: string): boolean => {
            const num1 = extractLessonNumber(title1);
            const num2 = extractLessonNumber(title2);
            if (!num1 || !num2) return false;

            if (!num1.includes('.') && num2 === `${num1}.1`) return true;
            if (!num2.includes('.') && num1 === `${num2}.1`) return true;

            return false;
          };

          for (let i = 0; i < validPendingLessons.length; i++) {
            if (processedIndices.has(i)) continue;

            const currentLesson = validPendingLessons[i];
            const groupLessons = [currentLesson];
            let totalDuration = currentLesson.durationMinutes || 15;

            if (i + 1 < validPendingLessons.length) {
              const nextLesson = validPendingLessons[i + 1];

              if (
                currentLesson.courseId === nextLesson.courseId &&
                currentLesson.moduleOrderIndex === nextLesson.moduleOrderIndex &&
                areLessonsGrouped(currentLesson.lessonTitle, nextLesson.lessonTitle)
              ) {
                groupLessons.push(nextLesson);
                totalDuration += nextLesson.durationMinutes || 15;
                processedIndices.add(i + 1);
              }
            }

            processedIndices.add(i);
            lessonGroups.push({
              lessons: groupLessons,
              totalDuration,
              primaryLessonTitle: currentLesson.lessonTitle,
            });
          }

          const sortedSlots = [...finalSlots].sort((a, b) => a.date.getTime() - b.date.getTime());

          const slotsUntilTarget: StudyPlannerCalendarFreeSlotWithDay[] = targetDateObj
            ? sortedSlots.filter(slot => {
              const slotDateOnly = new Date(slot.date);
              slotDateOnly.setHours(0, 0, 0, 0);
              const targetDateOnly = new Date(targetDateObj!);
              targetDateOnly.setHours(0, 0, 0, 0);
              return slotDateOnly.getTime() <= targetDateOnly.getTime();
            })
            : sortedSlots;

          const lessonDistribution: Array<{
            slot: StudyPlannerCalendarFreeSlotWithDay;
            lessons: Array<{ courseTitle: string; lessonTitle: string; lessonOrderIndex: number; durationMinutes: number }>;
            dateStr: string;
          }> = [];

          const usedSlotDates = new Set<string>();
          let currentLessonIndex = 0;
          const assignedLessonIds = new Set<string>();

          for (const slot of slotsUntilTarget) {
            if (currentLessonIndex >= validPendingLessons.length) break;

            const slotDuration = slot.durationMinutes;
            let usedDurationInSlot = 0;
            const lessonsForSlot: Array<{
              courseTitle: string;
              lessonTitle: string;
              lessonOrderIndex: number;
              durationMinutes: number;
            }> = [];

            let currentSlotModuleIndex: number | null = null;
            let currentSlotCourseId: string | null = null;

            while (currentLessonIndex < validPendingLessons.length) {
              const lesson = validPendingLessons[currentLessonIndex];

              if (!lesson || !lesson.lessonTitle || assignedLessonIds.has(lesson.lessonId)) {
                currentLessonIndex++;
                continue;
              }

              const baseDuration = (lesson as any).durationMinutes || 15;
              const finalDuration = Math.ceil(baseDuration * approachMultiplier);

              const fits = (usedDurationInSlot + finalDuration <= slotDuration);
              const isSlotEmpty = lessonsForSlot.length === 0;

              const isSameModule = isSlotEmpty || (
                currentSlotModuleIndex !== null &&
                lesson.moduleOrderIndex === currentSlotModuleIndex &&
                currentSlotCourseId === lesson.courseId
              );

              if (fits && (isSlotEmpty || isSameModule)) {
                lessonsForSlot.push({
                  courseTitle: lesson.courseTitle,
                  lessonTitle: lesson.lessonTitle,
                  lessonOrderIndex: lesson.lessonOrderIndex,
                  durationMinutes: finalDuration,
                });
                assignedLessonIds.add(lesson.lessonId);
                usedDurationInSlot += finalDuration;
                currentSlotModuleIndex = lesson.moduleOrderIndex;
                currentSlotCourseId = lesson.courseId;
                currentLessonIndex++;
              } else {
                break;
              }
            }

            if (lessonsForSlot.length > 0) {
              const slotKey = slot.dateStr + slot.start.toISOString();
              if (!usedSlotDates.has(slotKey)) {
                usedSlotDates.add(slotKey);
                lessonDistribution.push({
                  slot,
                  lessons: lessonsForSlot,
                  dateStr: slot.dateStr,
                });
              }
            }
          }

          if (currentLessonIndex < validPendingLessons.length) {
            const allAvailableSlots = [...sortedSlots];

            const allUnusedSlots = allAvailableSlots.filter(slot => {
              const slotKey = slot.dateStr + slot.start.toISOString();
              return !usedSlotDates.has(slotKey);
            });

            allUnusedSlots.sort((a, b) => a.date.getTime() - b.date.getTime());

            for (let slotIdx = 0; slotIdx < allUnusedSlots.length; slotIdx++) {
               if (currentLessonIndex >= validPendingLessons.length) break;

               const unusedSlot = allUnusedSlots[slotIdx];
               const slotDuration = unusedSlot.durationMinutes;
               let usedDurationInSlot = 0;
               const lessonsForSlot: Array<{
                courseTitle: string;
                lessonTitle: string;
                lessonOrderIndex: number;
                durationMinutes: number;
               }> = [];

               let currentSlotModuleIndex: number | null = null;
               let currentSlotCourseId: string | null = null;

               while (currentLessonIndex < validPendingLessons.length) {
                 const lesson = validPendingLessons[currentLessonIndex];

                 if (!lesson || !lesson.lessonTitle || assignedLessonIds.has(lesson.lessonId)) {
                   currentLessonIndex++;
                   continue;
                 }

                 const baseDuration = (lesson as any).durationMinutes || 15;
                 const finalDuration = Math.ceil(baseDuration * approachMultiplier);

                 const fits = (usedDurationInSlot + finalDuration <= slotDuration);
                 const isSlotEmpty = lessonsForSlot.length === 0;

                 const isSameModule = isSlotEmpty || (
                   currentSlotModuleIndex !== null &&
                   lesson.moduleOrderIndex === currentSlotModuleIndex &&
                   currentSlotCourseId === lesson.courseId
                 );

                 if (fits && (isSlotEmpty || isSameModule)) {
                   lessonsForSlot.push({
                     courseTitle: lesson.courseTitle,
                     lessonTitle: lesson.lessonTitle,
                     lessonOrderIndex: lesson.lessonOrderIndex,
                     durationMinutes: finalDuration,
                   });
                   assignedLessonIds.add(lesson.lessonId);
                   usedDurationInSlot += finalDuration;
                   currentSlotModuleIndex = lesson.moduleOrderIndex;
                   currentSlotCourseId = lesson.courseId;
                   currentLessonIndex++;
                 } else {
                   break;
                 }
               }

               if (lessonsForSlot.length > 0) {
                 const slotKey = unusedSlot.dateStr + unusedSlot.start.toISOString();
                 usedSlotDates.add(slotKey);
                 lessonDistribution.push({
                   slot: unusedSlot,
                   lessons: lessonsForSlot,
                   dateStr: unusedSlot.dateStr,
                 });
               }
            }
          }

          const storedDistribution: StudyPlannerStoredLessonDistribution[] = lessonDistribution.map(dist => ({
            dateStr: dist.dateStr,
            startTime: dist.slot.start.toISOString(),
            endTime: dist.slot.end.toISOString(),
            durationMinutes: dist.slot.durationMinutes,
            lessons: dist.lessons,
          }));

          setSavedLessonDistribution(storedDistribution);
          setSavedTargetDate(effectiveTargetDate || null);
          setSavedTotalLessons(validPendingLessons.length);

          const distByDay = new Map<string, typeof lessonDistribution>();
          lessonDistribution.forEach(dist => {
            const existing = distByDay.get(dist.dateStr) || [];
            existing.push(dist);
            distByDay.set(dist.dateStr, existing);
          });

          const sortedDays = Array.from(distByDay.keys()).sort((a, b) => {
            return new Date(a).getTime() - new Date(b).getTime();
          });

          sortedDays.forEach(dateStr => {
            const distributions = distByDay.get(dateStr)!;
            distributions.sort((a, b) => a.slot.start.getTime() - b.slot.start.getTime());

            const dateParts = dateStr.split('-');
            const dayDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            const dayName = distributions[0].slot.dayName;
            const formattedDate = dayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

            calendarMessage += `\n${dayName} ${formattedDate}:\n`;

            distributions.forEach(dist => {
              const realDurationMinutes = dist.lessons.reduce((sum, l) => sum + (l.durationMinutes || 15), 0);

              const startTime = dist.slot.start;
              const adjustedEndTime = new Date(startTime.getTime() + realDurationMinutes * 60000);

              const startTimeStr = startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
              const endTimeStr = adjustedEndTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

              calendarMessage += `   🕐 HORARIO EXACTO: ${startTimeStr} - ${endTimeStr} (${realDurationMinutes} min):\n`;

              dist.lessons.forEach(l => {
                calendarMessage += `   - ${l.lessonTitle} (${l.durationMinutes || 15} min)\n`;
              });
              calendarMessage += `\n`;
            });
          });

          const slotsAfterTarget = targetDateObj
            ? sortedSlots.filter(slot => {
              const slotDateOnly = new Date(slot.date);
              slotDateOnly.setHours(0, 0, 0, 0);
              const targetDateOnly = new Date(targetDateObj!);
              targetDateOnly.setHours(0, 0, 0, 0);
              return slotDateOnly.getTime() > targetDateOnly.getTime();
            }).length
            : 0;

          if (slotsAfterTarget > 0) {
            calendarMessage += `\n**Nota:** He identificado ${slotsAfterTarget} espacios adicionales disponibles después de tu fecha objetivo (${targetDate}). Estos pueden ser útiles para repaso o actividades complementarias.`;
          }
        }
      } else {
        const noEventsParts: string[] = [];

        if (userProfile) {
          const isB2BUser = userProfile.userType === 'b2b';
          const rolUser = userProfile.professionalProfile?.rol?.nombre;
          const areaUser = userProfile.professionalProfile?.area?.nombre;
          const orgNameUser = userProfile.organization?.name;

          const profileDesc: string[] = [];
          if (isB2BUser && orgNameUser) {
            profileDesc.push(`trabajas en ${orgNameUser}`);
          } else {
            profileDesc.push(`eres profesional independiente`);
          }
          if (rolUser) profileDesc.push(`como ${rolUser}`);
          if (areaUser) profileDesc.push(`en el área de ${areaUser}`);
          if (profileDesc.length > 0) {
            noEventsParts.push(`He analizado tu perfil. Veo que ${profileDesc.join(' ')}.`);
          } else {
            noEventsParts.push(`He analizado tu perfil.`);
          }
        } else {
          noEventsParts.push(`He analizado tu perfil.`);
        }

        noEventsParts.push(`\n`);
        noEventsParts.push(`📅 No encontré eventos programados en tu calendario para el próximo mes. ¡Esto nos da total flexibilidad para diseñar tu plan de estudios!`);
        noEventsParts.push(`\n`);
        noEventsParts.push(`¿Qué días de la semana prefieres estudiar? ¿Y en qué horario te concentras mejor: mañana, tarde o noche?`);

        calendarMessage = noEventsParts.join(' ');
      }

      setConversationHistory(prev => {
        const hasRecommendations = prev.some(msg =>
          msg.role === 'assistant' && (
            msg.content.includes('MIS RECOMENDACIONES') ||
            msg.content.includes('METAS SEMANALES') ||
            (msg.content.includes('analizado tu calendario') && msg.content.includes('horarios'))
          )
        );

        if (hasRecommendations && calendarMessage.includes('MIS RECOMENDACIONES')) {
          return prev;
        }

        return [...prev, { role: 'assistant', content: calendarMessage }];
      });

      if (isAudioEnabled) {
        let shortSummary = '';
        if (calendarEvents.length > 0) {
          if (finalSlots.length > 0) {
            const firstSlot = finalSlots[0];
            const timeStr = firstSlot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            shortSummary = `Analicé tu calendario del próximo mes. Te recomiendo estudiar el ${firstSlot.dayName} a las ${timeStr}. ¿Te parece bien?`;
          } else if (daysWithFreeTime.length > 0) {
            const days = daysWithFreeTime.slice(0, 2).map(d => d.dayName).join(' y ');
            shortSummary = `Analicé tu calendario del próximo mes. Te recomiendo estudiar los ${days}. ¿Te parece bien?`;
          } else {
            shortSummary = `Analicé tu calendario del próximo mes. Tu agenda está muy ocupada, pero podemos encontrar espacios para estudiar. ¿Te parece bien?`;
          }
        } else {
          shortSummary = `Calendario conectado. No encontré eventos en el próximo mes. ¿Qué días y horarios prefieres para estudiar?`;
        }
        await speakText(shortSummary);
      }

    } catch (error) {
      console.error('Error analizando calendario:', error);

      const errorMsg = `Tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} está conectado, pero hubo un problema al analizarlo.

Cuéntame manualmente:
¿Qué días de la semana prefieres estudiar?
¿En qué horario te funciona mejor: mañana, tarde o noche?`;

      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMsg }]);

      if (isAudioEnabled) {
        await speakText('Calendario conectado. ¿Qué días y horarios prefieres para estudiar?');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep ref in sync so analyzeCalendarAndSuggestB2B can call it
  analyzeCalendarAndSuggestRef.current = analyzeCalendarAndSuggest;

  const disconnectCalendar = async (provider: 'google' | 'microsoft') => {
    try {
      setIsConnectingCalendar(true);

      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desconectar el calendario');
      }

      setConnectedCalendar(null);
      setShowCalendarModal(false);

      const disconnectMsg = `He desconectado tu calendario de ${provider === 'google' ? 'Google' : 'Microsoft'}. Puedes volver a conectarlo cuando lo desees.`;
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: disconnectMsg
      }]);

      if (isAudioEnabled) {
        await speakText(`Calendario de ${provider === 'google' ? 'Google' : 'Microsoft'} desconectado exitosamente.`);
      }
    } catch (error) {
      console.error('[disconnectCalendar] Error desconectando calendario:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al desconectar el calendario';

      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: `No pude desconectar tu calendario. ${errorMsg}`
      }]);

      alert(`Error al desconectar calendario:\n\n${errorMsg}`);
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  const skipCalendarConnection = async () => {
    setShowCalendarModal(false);
    setCalendarSkipped(true);
    setIsProcessing(true);

    const userMsg = 'Prefiero no conectar mi calendario por ahora';
    setConversationHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const contextResponse = await fetch('/api/study-planner/user-context');
      let userProfile: any = null;

      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        if (contextData.success && contextData.data) {
          userProfile = contextData.data;

          setUserContext({
            userType: userProfile.userType || null,
            userName: userProfile.user?.firstName || userProfile.user?.displayName || userProfile.user?.username || null,
            rol: userProfile.professionalProfile?.rol?.nombre || null,
            area: userProfile.professionalProfile?.area?.nombre || null,
            nivel: userProfile.professionalProfile?.nivel?.nombre || null,
            tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
            organizationName: userProfile.organization?.name || null,
            minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
            maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
            workTeams: userProfile.workTeams?.map((team: any) => ({
              name: team.name || 'Equipo',
              role: team.role || 'member'
            })) || null,
          });
        }
      }

      let profileInfo = '';
      if (userProfile) {
        const isB2B = userProfile.userType === 'b2b';
        const rol = userProfile.professionalProfile?.rol?.nombre;
        const area = userProfile.professionalProfile?.area?.nombre;
        const nivel = userProfile.professionalProfile?.nivel?.nombre;
        const tamano = userProfile.professionalProfile?.tamanoEmpresa?.nombre;
        const orgName = userProfile.organization?.name;

        profileInfo = `\n\n**HE REVISADO TU PERFIL:**\n`;
        if (isB2B && orgName) {
          profileInfo += `- Tipo: Usuario B2B (perteneces a "${orgName}")\n`;
        } else {
          profileInfo += `- Tipo: Usuario B2C (profesional independiente)\n`;
        }
        if (rol) profileInfo += `- Rol: ${rol}\n`;
        if (area) profileInfo += `- Área: ${area}\n`;
        if (nivel) profileInfo += `- Nivel: ${nivel}\n`;
        if (tamano) profileInfo += `- Tamaño de empresa: ${tamano}\n`;

        const availability = calculateStudyPlannerEstimatedAvailability({
          rol,
          nivel,
          tamanoEmpresa: tamano,
          minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados,
          maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados,
          userType: userProfile.userType,
        });

        profileInfo += `\n**ESTIMACIÓN BASADA EN TU PERFIL:**\n`;
        profileInfo += `- Tiempo disponible: ~${availability.minutesPerDay} min/día\n`;
        profileInfo += `- Sesiones recomendadas: ${availability.recommendedSessionLength} min`;
      }

      const liaResponse = `Entendido, no hay problema.${profileInfo}

Cuéntame:
¿Qué días de la semana prefieres estudiar?
¿En qué horario te funciona mejor: mañana, tarde o noche?

(Por ejemplo: "Lunes, miércoles y viernes por la noche" o "Fines de semana por la mañana")`;

      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);

      if (isAudioEnabled) {
        const shortResponse = userProfile
          ? `Entendido. Veo que eres ${userProfile.professionalProfile?.rol?.nombre || 'profesional'}. ¿Qué días y horarios prefieres para estudiar?`
          : 'Entendido. ¿Qué días y horarios prefieres para estudiar?';
        await speakText(shortResponse);
      }
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      const liaResponse = 'Entendido. Cuéntame: ¿Qué días de la semana prefieres estudiar y en qué horarios? (Por ejemplo: "Lunes a viernes por la noche")';
      setConversationHistory(prev => [...prev, { role: 'assistant', content: liaResponse }]);

      if (isAudioEnabled) {
        await speakText(liaResponse);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    analyzeCalendarAndSuggest,
    analyzeCalendarAndSuggestB2B,
    disconnectCalendar,
    skipCalendarConnection,
  };
}
