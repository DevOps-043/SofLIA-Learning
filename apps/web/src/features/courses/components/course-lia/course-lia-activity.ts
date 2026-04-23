import type { CourseLessonContext } from '../../../../core/types/lia.types';
import type { ActivityContextType } from '../../context/LiaCourseContext';

export function buildActivityWelcomeContext(
  currentActivity: ActivityContextType,
  resolvedLessonContext: CourseLessonContext | undefined,
): CourseLessonContext {
  const baseActivitiesContext = resolvedLessonContext?.activitiesContext;

  return {
    ...(resolvedLessonContext ?? {}),
    activitiesContext: {
      totalActivities: baseActivitiesContext?.totalActivities ?? 0,
      requiredActivities: baseActivitiesContext?.requiredActivities ?? 0,
      completedActivities: baseActivitiesContext?.completedActivities ?? 0,
      pendingRequiredCount: baseActivitiesContext?.pendingRequiredCount ?? 0,
      pendingRequiredTitles: baseActivitiesContext?.pendingRequiredTitles,
      activityTypes: baseActivitiesContext?.activityTypes,
      currentActivityFocus: {
        title: currentActivity.title,
        type: currentActivity.type,
        isRequired: baseActivitiesContext?.currentActivityFocus?.isRequired ?? false,
        isCompleted: baseActivitiesContext?.currentActivityFocus?.isCompleted ?? false,
        description: currentActivity.description || currentActivity.title,
        prompts: currentActivity.prompts,
      },
    },
  };
}

export function buildActivitySystemTrigger(currentActivity: ActivityContextType) {
  return `[SYSTEM_EVENT: USER_STARTED_ACTIVITY]
Actividad: "${currentActivity.title}"
Descripcion: "${currentActivity.description}"

Instruccion para SofLIA:
El usuario acaba de hacer clic en "Interactuar con SofLIA" para esta actividad.
1. Saludalo por su nombre y menciona explicitamente que estas lista para guiarlo en "${currentActivity.title}".
2. Explica brevemente el objetivo (1 frase).
3. Haz la primera pregunta o da la primera instruccion para empezar.
NO esperes a que el usuario hable. TOMA LA INICIATIVA AHORA.`;
}
