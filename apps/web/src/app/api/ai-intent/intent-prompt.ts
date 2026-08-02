import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'

/**
 * Prompt del clasificador de intenciones, en sus dos variantes.
 *
 * `buildIntentPromptForGoogle` es el TEXTO ORIGINAL, congelado.
 */

const INTENT_OUTPUT_SHAPE = `{
  "intent": "create_prompt" | "navigate" | "question" | "feedback" | "general",
  "confidence": 0.0 a 1.0,
  "entities": {
    "promptTopic": "tema del prompt si aplica",
    "targetPage": "pagina destino si aplica",
    "category": "categoria si aplica"
  }
}`

/** VARIANTE GEMINI. Texto original, congelado. */
function buildIntentPromptForGoogle(): string {
  return `Eres un clasificador de intenciones para una plataforma educativa.
Analiza el mensaje del usuario y devuelve SOLO un JSON con este formato:
${INTENT_OUTPUT_SHAPE}

Intenciones:
- create_prompt: Usuario quiere crear un prompt o plantilla de IA
- navigate: Usuario quiere ir a otra seccion del sitio
- question: Usuario hace una pregunta
- feedback: Usuario da opinion o reporta problema
- general: Conversacion general

NO incluyas ningun texto adicional, SOLO el JSON.`
}

/**
 * VARIANTE OPENAI.
 *
 * Diferencias respecto de la de Gemini:
 *
 * 1. LAS CATEGORÍAS SE ORDENAN POR DESCARTE. El original las lista en paralelo y
 *    deja `general` al final como una más; en la práctica es la categoría de
 *    reserva, y decirlo evita que el modelo fuerce el mensaje hacia una de las
 *    específicas cuando ninguna encaja.
 *
 * 2. SE DEFINE `confidence`. Sin anclaje, el clasificador devuelve 0.9 para todo
 *    y el valor deja de servir para decidir si actuar sobre la intención.
 *
 * 3. SIN "NO incluyas ningun texto adicional": la API ya impone el formato. El
 *    presupuesto de este propósito es de 200 tokens, así que cada línea del
 *    prompt que no aporta se nota.
 */
function buildIntentPromptForOpenAi(_profile: PromptModelProfile): string {
  return `Clasificas la intencion del mensaje de un usuario en una plataforma educativa.

## Como elegir la intencion

Recorre las categorias en este orden y quedate con la primera que encaje:
1. create_prompt: pide crear un prompt o una plantilla de IA.
2. navigate: quiere ir a otra seccion de la plataforma.
3. feedback: da su opinion o reporta un problema.
4. question: hace una pregunta.
5. general: no encaja en ninguna de las anteriores. Es la categoria de reserva; usala sin forzar el mensaje hacia otra.

## Como puntuar confidence

- 0.9 o mas: el mensaje es inequivoco.
- 0.6 a 0.9: encaja, pero admite otra lectura.
- Menos de 0.6: el mensaje es ambiguo o demasiado corto.

Rellena en "entities" solo los campos que el mensaje mencione; omite el resto.

## Formato de salida

${INTENT_OUTPUT_SHAPE}`
}

/** Prompt del clasificador de intenciones, en la variante del proveedor destino. */
export function buildIntentSystemPrompt(profile: PromptModelProfile): string {
  return selectPromptVariant(profile, {
    google: buildIntentPromptForGoogle,
    openai: buildIntentPromptForOpenAi,
  })
}
