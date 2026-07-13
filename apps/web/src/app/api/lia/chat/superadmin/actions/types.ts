import type { z } from 'zod'
import type { PlatformSuperadminGrant } from '../authorization'

/**
 * Contratos del motor de acciones administrativas de SofLIA.
 *
 * Modelo de ejecución en DOS FASES (nunca se ejecuta nada en el mismo turno en
 * que el modelo lo propone):
 *
 *   Turno N   — el modelo emite <soflia-action>{...}</soflia-action>.
 *               El servidor NO ejecuta: valida parámetros, resuelve las
 *               entidades objetivo contra la BD, y responde al admin con un
 *               resumen legible + un token de confirmación FIRMADO.
 *   Turno N+1 — si el admin confirma explícitamente, el servidor verifica la
 *               firma del token y ejecuta la acción.
 *
 * Esto neutraliza acciones alucinadas por el modelo y comandos inyectados en
 * datos: un atacante que logre que el modelo emita una acción todavía necesita
 * que un humano superadmin la confirme en el turno siguiente.
 */

/**
 * Riesgo de la acción. Determina el énfasis del resumen de confirmación.
 * NINGÚN nivel permite saltarse la confirmación humana.
 */
export type ActionRisk =
  /** Crea entidades nuevas; reversible con esfuerzo. */
  | 'create'
  /** Cambia configuración existente; reversible. */
  | 'configure'
  /** Afecta el acceso de una persona o expone credenciales; alto impacto. */
  | 'sensitive'

/** Resultado de la ejecución de una acción, ya listo para mostrarse al admin. */
export interface ActionExecutionResult {
  /** Resumen en lenguaje natural de lo que ocurrió realmente. */
  summary: string
  /** Datos relevantes del resultado (ids creados, enlaces, etc.). */
  details?: Record<string, string | number | boolean | null>
}

/**
 * Vista previa de la acción, construida DESPUÉS de resolver las entidades
 * objetivo contra la base de datos. Es lo que el admin confirma.
 */
export interface ActionPreview {
  /** Descripción exacta de lo que se va a hacer, con nombres reales resueltos. */
  summary: string
  /** Advertencias específicas (p. ej. "el usuario perderá el acceso de inmediato"). */
  warnings?: string[]
}

/** Contexto de ejecución que el motor entrega a cada handler. */
export interface ActionContext {
  /** Grant verificado (capacidad `admin-actions`). */
  grant: PlatformSuperadminGrant
  /** Id del superadmin que ejecuta (para atribución en los servicios admin). */
  adminUserId: string
  /** IP y user-agent, para la trazabilidad de los servicios admin existentes. */
  requestInfo: { ip: string; userAgent: string }
}

/**
 * Definición tipada de una acción administrativa (lo que escribe cada handler).
 *
 * `schema` valida lo que emite el modelo (nunca se confía en él); su tipo de
 * ENTRADA es `unknown` a propósito, porque el input viene de JSON del modelo,
 * mientras que la SALIDA es `TParams` ya normalizado (defaults aplicados).
 * `preview` resuelve las entidades reales y describe el efecto: si el objetivo
 * no existe, debe lanzar, de modo que jamás se ofrezca confirmar algo inválido.
 * `execute` invoca los SERVICIOS ADMIN EXISTENTES — no reimplementa mutaciones.
 */
export interface ActionDefinition<TParams> {
  id: string
  risk: ActionRisk
  /** Descripción para el catálogo que ve el modelo en el system prompt. */
  description: string
  /** Ejemplo de parámetros para el catálogo del system prompt. */
  paramsExample: Record<string, unknown>
  schema: z.ZodType<TParams, z.ZodTypeDef, unknown>
  preview(params: TParams, context: ActionContext): Promise<ActionPreview>
  execute(params: TParams, context: ActionContext): Promise<ActionExecutionResult>
}

/** Resultado de validar los parámetros que propuso el modelo. */
export type ActionParamsParseResult =
  | { success: true; params: unknown }
  | { success: false; message: string }

/**
 * Acción tal como la guarda el registro, con el tipo de sus parámetros borrado.
 *
 * El borrado es necesario porque el registro es una lista heterogénea (cada
 * acción tiene sus propios parámetros) y `ActionDefinition<T>` es invariante en
 * `T`. `defineAction` es el ÚNICO lugar donde ocurre la conversión, y mantiene
 * la invariante que la hace segura: `preview` y `execute` solo reciben valores
 * que salieron de `parseParams`, es decir, ya validados por su propio schema.
 */
export interface RegisteredAction {
  id: string
  risk: ActionRisk
  description: string
  paramsExample: Record<string, unknown>
  parseParams(rawParams: unknown): ActionParamsParseResult
  preview(params: unknown, context: ActionContext): Promise<ActionPreview>
  execute(params: unknown, context: ActionContext): Promise<ActionExecutionResult>
}

/**
 * Registra una acción tipada borrando su tipo de parámetros de forma segura.
 * Los `as TParams` de aquí son sólidos porque `preview`/`execute` únicamente se
 * invocan con la salida de `parseParams`, que ya pasó por `schema`.
 */
export function defineAction<TParams>(
  definition: ActionDefinition<TParams>,
): RegisteredAction {
  return {
    id: definition.id,
    risk: definition.risk,
    description: definition.description,
    paramsExample: definition.paramsExample,

    parseParams(rawParams) {
      const parsed = definition.schema.safeParse(rawParams)

      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0]
        const path = firstIssue?.path.join('.')
        return {
          success: false,
          message: `Los parámetros de "${definition.id}" no son válidos${
            path ? ` (${path})` : ''
          }: ${firstIssue?.message ?? 'formato incorrecto'}.`,
        }
      }

      return { success: true, params: parsed.data }
    },

    preview(params, context) {
      return definition.preview(params as TParams, context)
    },

    execute(params, context) {
      return definition.execute(params as TParams, context)
    },
  }
}

/** Acción propuesta por el modelo, ya validada contra su schema. */
export interface ValidatedActionProposal {
  definition: RegisteredAction
  params: unknown
}

/** Payload del token de confirmación firmado (HMAC, ver confirmation-token.ts). */
export interface ActionConfirmationTokenPayload {
  /** Id de la acción en el registro. */
  actionId: string
  /** Parámetros ya validados y normalizados en la fase de propuesta. */
  params: unknown
  /** Admin al que se le emitió: impide que otra sesión reutilice el token. */
  adminUserId: string
  /** Expiración (ms epoch). Verificada por `verifyToken`. */
  exp: number
}
