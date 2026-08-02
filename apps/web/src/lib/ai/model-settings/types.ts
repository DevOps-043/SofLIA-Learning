import type { AiProvider, AiProviderSelection } from '../providers/provider-registry'
import type { AiThinkingLevel } from './thinking'

/**
 * Agrupación de propósitos para la navegación del panel de administración.
 * No tiene efecto en runtime: es exclusivamente presentacional.
 */
export type AiPurposeGroup =
  | 'soflia'
  | 'courses'
  | 'analytics'
  | 'content'
  | 'platform'

/** Parámetros que un propósito concreto admite configurar. */
export interface AiPurposeCapabilities {
  maxOutputTokens: boolean
  temperature: boolean
  thinkingLevel: boolean
}

/** Valores efectivos cuando no hay override en base de datos. */
export interface AiPurposeDefaults {
  maxOutputTokens: number | null
  model: string
  temperature: number | null
  thinkingLevel: AiThinkingLevel
}

/**
 * Definición estática de un propósito de IA. Vive en código (no en base de
 * datos) para que el catálogo sea versionable, tipado y validable: la base solo
 * almacena overrides de propósitos que existen aquí.
 */
export interface AiModelPurposeDefinition {
  capabilities: AiPurposeCapabilities
  defaults: AiPurposeDefaults
  /** Descripción funcional corta, mostrada en el panel. */
  descriptionKey: string
  group: AiPurposeGroup
  id: string
  labelKey: string
  /**
   * Variables de entorno consultadas, en orden, cuando no hay override en base
   * de datos. Se conservan para que el despliegue de esta funcionalidad no
   * altere el comportamiento vigente y para permitir rollback sin migración.
   */
  legacyModelEnvVars: readonly string[]
  /**
   * Proveedores capaces de atender este propósito. Omitirlo significa "todos".
   *
   * No todos son intercambiables: el dictado envía audio en línea y el
   * procesamiento de vídeo envía vídeo, capacidades que hoy solo tiene Gemini a
   * través de este contrato. Se declara SOLO en los propósitos restringidos, para
   * que la excepción destaque en el catálogo en vez de repetir la misma lista en
   * las veinte entradas. El panel usa este dato para impedir seleccionar un
   * proveedor que rompería la funcionalidad, en vez de descubrirlo cuando un
   * usuario la utilice.
   */
  supportedProviders?: readonly AiProvider[]
}

/** Origen del que se resolvió cada valor efectivo. Útil para el panel y para diagnóstico. */
export type AiModelSettingsSource = 'database' | 'environment' | 'default'

/** Configuración efectiva ya resuelta y lista para enviar al proveedor. */
export interface ResolvedAiModelSettings {
  /** `true` cuando existe una fila de override en base de datos. */
  hasDatabaseOverride: boolean
  maxOutputTokens: number | null
  model: string
  modelSource: AiModelSettingsSource
  /** Proveedor efectivo al que se enviará la llamada. */
  provider: AiProvider
  /**
   * Selección guardada. `auto` indica que el proveedor se dedujo del nombre del
   * modelo; el panel lo necesita para distinguir "deducido" de "fijado a mano".
   */
  providerSelection: AiProviderSelection
  purpose: string
  temperature: number | null
  thinkingLevel: AiThinkingLevel
  updatedAt: string | null
}

/** Cambio solicitado desde el panel. Campos ausentes conservan su valor actual. */
export interface AiModelSettingsUpdate {
  maxOutputTokens?: number | null
  model?: string
  provider?: AiProviderSelection
  temperature?: number | null
  thinkingLevel?: AiThinkingLevel
}
