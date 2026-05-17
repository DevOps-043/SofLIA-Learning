import type { MutableRefObject } from 'react'
import type { WebSpeechRequestPayload } from '../types'
import { selectPreferredWebSpeechVoice } from './voice-selection.service'

export function speakWithWebSpeech(
  text: string,
  utteranceRef: MutableRefObject<SpeechSynthesisUtterance | null>,
  payload: WebSpeechRequestPayload,
  onFinish: () => void,
) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = payload.lang
  utterance.rate = payload.rate
  utterance.pitch = payload.pitch
  utterance.volume = payload.volume
  utterance.onend = () => {
    utteranceRef.current = null
    onFinish()
  }
  utterance.onerror = () => {
    utteranceRef.current = null
    onFinish()
  }
  utteranceRef.current = utterance

  let hasStartedSpeaking = false
  const startSpeaking = () => {
    if (hasStartedSpeaking || utteranceRef.current !== utterance) {
      return
    }

    hasStartedSpeaking = true
    const preferredVoice = selectPreferredWebSpeechVoice(
      window.speechSynthesis.getVoices(),
      payload.lang,
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    startSpeaking()
    return
  }

  const handleVoicesChanged = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
    startSpeaking()
  }

  window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
  window.setTimeout(() => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
    startSpeaking()
  }, 250)
}
