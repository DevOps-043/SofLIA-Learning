import { detectIntentWithAI } from './intent-detection/ai-detector'
import { detectCreatePromptIntent } from './intent-detection/create-prompt-detector'
import { detectNavigateIntent } from './intent-detection/navigation-detector'
import { detectNanoBananaIntent } from './intent-detection/nanobana-detector'
import { isQuestion } from './intent-detection/question-detector'
export type { Intent, IntentResult } from './intent-detection/types'
import type { IntentResult } from './intent-detection/types'

export class IntentDetectionService {
  static async detectIntent(message: string): Promise<IntentResult> {
    const localResult = this.detectIntentLocal(message)
    return localResult
  }

  static detectIntentLocal(message: string): IntentResult {
    const messageLower = message.toLowerCase().trim()
    const nanobanaIntent = detectNanoBananaIntent(messageLower, message)
    if (nanobanaIntent.confidence >= 0.65) return nanobanaIntent

    const promptIntent = detectCreatePromptIntent(messageLower, message)
    if (promptIntent.confidence >= 0.6) return promptIntent

    const navigateIntent = detectNavigateIntent(messageLower)
    if (navigateIntent.confidence >= 0.6) return navigateIntent

    if (isQuestion(messageLower)) {
      return { intent: 'question', confidence: 0.7 }
    }

    return { intent: 'general', confidence: 0.5 }
  }

  static async detectIntentWithAI(message: string): Promise<IntentResult> {
    return detectIntentWithAI(message, this.detectIntentLocal.bind(this))
  }
}
