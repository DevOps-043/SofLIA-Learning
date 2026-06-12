/**
 * Turno individual de una "Conversación guiada con SofLIA" (`soflia_dialogue_turns`).
 * Es la fuente real de los MENSAJES intercambiados con SofLIA en las actividades de
 * diálogo, que el motor nuevo NO escribe en `lia_messages`. Se usa para la métrica
 * de adopción/uso de SofLIA. `turns_count` de la sesión no es fiable (subcuenta), por
 * eso se cuentan los turnos reales.
 */
export interface DialogueTurnRecord {
  session_id: string
  role: string | null
  created_at: string | null
}
