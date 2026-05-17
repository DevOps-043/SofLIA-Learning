import type { IntentResult } from './types'

export async function detectIntentWithAI(
  message: string,
  fallback: (message: string) => IntentResult,
): Promise<IntentResult> {
  try {
    const response = await fetch('/api/ai-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error('Error en detección de intención con IA')
    }

    return await response.json() as IntentResult
  } catch (error) {
    console.error('Error detectando intención con IA:', error)
    return fallback(message)
  }
}
