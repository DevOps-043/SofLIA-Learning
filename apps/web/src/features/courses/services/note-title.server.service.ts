import 'server-only'

import { generateAiText, isAiPurposeAvailable } from '@/lib/ai/providers/ai-text-gateway.server'
import { logger } from '@/lib/utils/logger'

/**
 * Título automático de una nota de lección.
 *
 * Estaba duplicado literalmente en las rutas de crear y actualizar nota; se
 * extrae aquí para que el prompt, el propósito de IA y la degradación vivan en
 * un solo sitio y no puedan divergir.
 *
 * DEGRADACIÓN: nunca lanza. El título es un detalle de presentación y no debe
 * impedir que se guarde la nota del usuario; ante cualquier fallo se devuelve el
 * título por defecto.
 */

const DEFAULT_NOTE_TITLE = 'Nota de estudio'
const MAX_CONTENT_CHARS = 1_500

function buildTitlePrompt(plainContent: string): string {
  return `Eres un asistente experto en educacion que genera titulos cortos, profesionales y descriptivos para notas de estudio.

Contenido de la nota: "${plainContent}"

Instrucciones:
1. El titulo debe ser muy corto (maximo 5 palabras).
2. Debe capturar la esencia principal del contenido.
3. Evita palabras genericas como "Nota sobre" o "Resumen de".
4. Responde UNICAMENTE con el texto del titulo, sin comillas, sin puntos finales y sin explicaciones.
5. Idioma: Espanol.`
}

function sanitizeGeneratedTitle(rawTitle: string): string | null {
  const cleaned = rawTitle
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\.$/, '')
    .trim()

  if (!cleaned || cleaned.toLowerCase().includes('error')) return null

  return cleaned
}

export async function generateNoteTitle(noteContent: string): Promise<string> {
  try {
    if (!(await isAiPurposeAvailable('lesson_auto_note'))) {
      return DEFAULT_NOTE_TITLE
    }

    const plainContent = noteContent.replace(/<[^>]*>?/gm, '').substring(0, MAX_CONTENT_CHARS)
    // No se recorta `maxOutputTokens`: aunque el título ocupe pocas palabras, en
    // los modelos con razonamiento interno ese presupuesto lo consume también el
    // razonamiento, y un tope pequeño devolvería una respuesta vacía. Solo se
    // paga lo generado, así que heredar el del propósito no encarece la llamada.
    const result = await generateAiText({
      circuitBreakerName: 'lesson-note-title',
      prompt: buildTitlePrompt(plainContent),
      purpose: 'lesson_auto_note',
    })

    return sanitizeGeneratedTitle(result.text) ?? DEFAULT_NOTE_TITLE
  } catch (error) {
    logger.warn('No se pudo generar el título automático de la nota', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return DEFAULT_NOTE_TITLE
  }
}
