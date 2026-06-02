import { config } from '@/config/env'

export function getGeminiLiveApiKey() {
  return process.env.GEMINI_LIVE_API_KEY || config.GEMINI_API_KEY || config.GOOGLE_API_KEY || null
}

export function getGeminiLiveModel() {
  return config.GEMINI_LIVE_MODEL || 'gemini-3.5-flash-live'
}

export function isLiaLiveConfigured() {
  return Boolean(getGeminiLiveApiKey())
}

export function buildGeminiLiveWebSocketUrl() {
  const apiKey = getGeminiLiveApiKey()
  if (!apiKey) {
    return null
  }

  return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`
}

export const SOFLIA_LIVE_SYSTEM_INSTRUCTION =
  'Eres SofLIA, una tutora de aprendizaje empresarial. Responde por voz con claridad, calidez y precision. Mantén respuestas breves cuando el usuario hable por audio, confirma lo que entendiste cuando sea util y evita inventar informacion.'
