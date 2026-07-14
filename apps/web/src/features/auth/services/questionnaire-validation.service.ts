/**
 * Estado del cuestionario de onboarding.
 *
 * DESACTIVADO. El cuestionario estaba ligado al acceso a "comunidades", una
 * feature de consumidor que se retiró (la plataforma es B2B pura). Su tabla de
 * respuestas (`respuestas`) ya no existe, y la puerta (`requiresQuestionnaire`)
 * lleva devolviendo `false` para todos los usuarios.
 *
 * Se conserva la clase como no-op porque el proxy de sesión, la página
 * `/welcome` y `/api/auth/questionnaire-status` siguen invocándola. Antes cada
 * una de esas llamadas disparaba consultas a tablas inexistentes; ahora devuelve
 * el estado "no requerido" sin tocar la base. Si el onboarding se reactiva, este
 * es el único punto que hay que reimplementar.
 */

export interface QuestionnaireStatus {
  isGoogleOAuth: boolean
  hasProfile: boolean
  hasResponses: boolean
  isCompleted: boolean
  requiresQuestionnaire: boolean
}

const DISABLED_STATUS: QuestionnaireStatus = {
  isGoogleOAuth: false,
  hasProfile: false,
  hasResponses: false,
  isCompleted: false,
  requiresQuestionnaire: false,
}

export class QuestionnaireValidationService {
  /** El cuestionario está desactivado: ningún usuario lo requiere. */
  static async requiresQuestionnaire(_userId: string): Promise<boolean> {
    return false
  }

  /** El cuestionario está desactivado: no se notifica a nadie. */
  static async normalUserNeedsQuestionnaire(_userId: string): Promise<boolean> {
    return false
  }

  static async getQuestionnaireStatus(_userId: string): Promise<QuestionnaireStatus> {
    return DISABLED_STATUS
  }
}
