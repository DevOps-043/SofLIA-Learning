import type { LearnActivity, LearnActivityType } from '../../types';

/**
 * Orden de presentación de las actividades dentro de una lección.
 *
 * Las reflexiones se muestran primero, luego el resto de actividades
 * (conversaciones con IA, ejercicios, etc.). Los quizzes viven en la
 * sección de materiales y se renderizan después, por lo que no se
 * incluyen aquí.
 *
 * Cualquier tipo no listado cae al grupo por defecto (valor más alto),
 * preservando el orden relativo definido por `activity_order_index`.
 */
const ACTIVITY_TYPE_DISPLAY_PRIORITY: Partial<Record<LearnActivityType, number>> = {
  reflection: 0,
};

const DEFAULT_DISPLAY_PRIORITY = 1;

function getActivityDisplayPriority(activity: LearnActivity): number {
  return ACTIVITY_TYPE_DISPLAY_PRIORITY[activity.activity_type] ?? DEFAULT_DISPLAY_PRIORITY;
}

/**
 * Devuelve una copia ordenada de las actividades: reflexiones primero y,
 * dentro de cada grupo, el orden original (`activity_order_index`).
 *
 * Es estable y no muta el arreglo recibido.
 */
export function sortActivitiesByDisplayOrder(
  activities: readonly LearnActivity[],
): LearnActivity[] {
  return activities
    .map((activity, index) => ({ activity, index }))
    .sort((a, b) => {
      const priorityDelta =
        getActivityDisplayPriority(a.activity) - getActivityDisplayPriority(b.activity);
      if (priorityDelta !== 0) return priorityDelta;

      const orderDelta = a.activity.activity_order_index - b.activity.activity_order_index;
      if (orderDelta !== 0) return orderDelta;

      // Empate total: conserva el orden de llegada (sort estable explícito).
      return a.index - b.index;
    })
    .map(({ activity }) => activity);
}
