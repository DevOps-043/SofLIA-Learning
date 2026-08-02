import type { AiThinkingLevel } from '../model-settings/thinking'
import type { AiProvider } from './provider-registry'

/**
 * Contrato neutral de generación de texto.
 *
 * Es el único formato que conocen los puntos de llamada: ni Gemini ni OpenAI
 * aparecen en sus firmas. Cada adaptador traduce este contrato al SDK de su
 * proveedor, de modo que cambiar de modelo desde el panel no exige tocar código.
 *
 * Módulo de tipos puro: seguro de importar desde cualquier capa.
 */

/** Fragmento de texto de un mensaje. */
export interface AiTextPart {
  text: string
  type: 'text'
}

/**
 * Fragmento binario en base64 (imagen, audio, vídeo).
 *
 * Solo lo admiten los proveedores con soporte multimodal para ese tipo MIME
 * concreto; el gateway rechaza la petición antes de llamar si el proveedor
 * configurado no puede procesarlo, en lugar de dejar que falle en el proveedor.
 */
export interface AiInlineDataPart {
  data: string
  mimeType: string
  type: 'inlineData'
}

export type AiContentPart = AiInlineDataPart | AiTextPart

/** Turno previo de la conversación. */
export interface AiTurn {
  parts: AiContentPart[]
  role: 'assistant' | 'user'
}

/**
 * Esquema JSON al que debe ceñirse la respuesta. Ambos proveedores lo soportan
 * de forma nativa (`responseJsonSchema` en Gemini, `text.format.json_schema` en
 * OpenAI), lo que evita tener que reparar JSON mal formado después.
 */
export interface AiJsonSchema {
  /** Identificador corto del esquema; OpenAI lo exige, Gemini lo ignora. */
  name: string
  schema: Record<string, unknown>
}

export interface AiGenerationRequest {
  /** Nombre del breaker que aísla este punto de llamada de los demás. */
  circuitBreakerName: string
  history?: AiTurn[]
  /** Fuerza salida JSON validada contra el esquema. Implica `responseAsJson`. */
  jsonSchema?: AiJsonSchema
  maxOutputTokens?: number
  model: string
  prompt: AiContentPart[] | string
  provider: AiProvider
  /** Fuerza salida JSON sin esquema (modo objeto JSON). */
  responseAsJson?: boolean
  systemInstruction?: string
  temperature?: number
  thinkingLevel?: AiThinkingLevel
  timeoutMs?: number
}

/**
 * Consumo de tokens en nomenclatura neutral.
 *
 * `inputTokens`/`outputTokens` en lugar de `promptTokenCount`/
 * `candidatesTokenCount` (Gemini) o `input_tokens`/`output_tokens` (OpenAI):
 * el consumidor no debería saber de qué proveedor vino la respuesta.
 */
export interface AiUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface AiGenerationResult {
  /** Modelo realmente usado, ya normalizado por el adaptador. */
  model: string
  provider: AiProvider
  text: string
  /**
   * `true` cuando el proveedor cortó la respuesta por agotar el presupuesto de
   * salida. Es un dato de diagnóstico esencial: en los modelos con razonamiento
   * interno, este se descuenta del mismo presupuesto, así que un JSON truncado
   * suele significar "maxOutputTokens insuficiente para este propósito" y no
   * "el modelo respondió mal".
   */
  truncated?: boolean
  usage?: AiUsage
}

/**
 * Respuesta en streaming, normalizada como una secuencia de fragmentos de texto
 * VISIBLE.
 *
 * Deliberadamente no expone eventos del proveedor: cada uno emite un protocolo
 * distinto (chunks de `Content` en Gemini, eventos tipados en OpenAI) y filtrar
 * ahí el razonamiento interno es responsabilidad del adaptador, no de quien
 * consume el stream.
 */
export interface AiTextStream {
  model: string
  provider: AiProvider
  textChunks: AsyncIterable<string>
}

/** Contrato que implementa cada adaptador de proveedor. */
export type AiTextAdapter = (request: AiGenerationRequest) => Promise<AiGenerationResult>

/** Contrato de streaming que implementa cada adaptador de proveedor. */
export type AiStreamAdapter = (request: AiGenerationRequest) => Promise<AiTextStream>

/**
 * Error lanzado cuando la petición no es compatible con el proveedor
 * configurado (p. ej. audio en un proveedor sin soporte para ese MIME). Se
 * distingue de un fallo del proveedor porque es un error de configuración y debe
 * corregirse en el panel, no reintentarse.
 */
export class UnsupportedAiRequestError extends Error {
  readonly provider: AiProvider

  constructor(provider: AiProvider, detail: string) {
    super(`El proveedor "${provider}" no admite esta petición: ${detail}`)
    this.name = 'UnsupportedAiRequestError'
    this.provider = provider
  }
}
