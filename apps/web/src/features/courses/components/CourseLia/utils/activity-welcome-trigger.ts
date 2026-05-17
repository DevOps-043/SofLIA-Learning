import type { ActivityContextType } from '@/features/courses/context/LiaCourseContext';

export function buildActivityWelcomeTrigger(activity: ActivityContextType) {
  return `[SYSTEM_EVENT: USER_STARTED_ACTIVITY]
Actividad: "${activity.title}"
Descripcion: "${activity.description}"

Instruccion para SofLIA:
El usuario acaba de hacer clic en "Interactuar con SofLIA" para esta actividad.
1. Saludalo por su nombre y menciona explicitamente que estas lista para guiarlo en "${activity.title}".
2. Explica brevemente el objetivo (1 frase).
3. Haz la primera pregunta o da la primera instruccion para empezar.
NO esperes a que el usuario hable. TOMA LA INICIATIVA AHORA.`;
}
