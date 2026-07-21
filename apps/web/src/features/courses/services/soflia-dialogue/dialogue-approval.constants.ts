/**
 * Umbral de aprobación de la actividad de diálogo SofLIA.
 *
 * PRODUCTO: para avanzar de lección, el alumno debe aprobar la actividad SofLIA con
 * un puntaje >= 60% evaluado por el modelo. Este umbral es AUTORITATIVO y fijo: se
 * usa tanto en la decisión de completado (`dialogue-policy-engine`) como en el prompt
 * del evaluador (`dialogue-evaluator`), ignorando cualquier `approvalMinimum` guardado
 * en la config de la actividad. Fijarlo aquí garantiza consistencia y evita que una
 * config legacy o manipulada baje la barra.
 */
export const SOFLIA_DIALOGUE_APPROVAL_MINIMUM = 60
