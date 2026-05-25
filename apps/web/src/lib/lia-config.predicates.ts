import { SofLIA_CONFIG } from './lia-config.values'

export function isOffTopic(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return SofLIA_CONFIG.detection.offTopic.some((pattern) =>
    lowerMessage.includes(pattern),
  )
}

export function hasPromptInjection(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return SofLIA_CONFIG.detection.promptInjection.some((pattern) =>
    lowerMessage.includes(pattern),
  )
}

export function getAppropriateResponse(message: string): string {
  if (hasPromptInjection(message)) {
    return SofLIA_CONFIG.responses.injectionDetected
  }

  if (isOffTopic(message)) {
    return SofLIA_CONFIG.responses.offTopic
  }

  return SofLIA_CONFIG.responses.redirect
}
