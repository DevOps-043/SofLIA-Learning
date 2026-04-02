'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getElevenLabsVoiceSettings, getWebSpeechVoiceSettings } from '../../../utils/tts-voice-settings'
import { isTTSAbortError, playAudioBlob, requestTTSAudio, speakWithWebSpeech } from '../../../services/tts'
import {
  cleanContextualVoiceGuideSpeechText,
  getContextualVoiceGuideSpeechLanguage,
} from '../services/contextual-voice-guide-voice.service'

interface UseContextualVoiceGuideVoiceOptions {
  isVisible: boolean
  isAudioEnabled: boolean
  language: string
}

export function useContextualVoiceGuideVoice({
  isVisible,
  isAudioEnabled,
  language,
}: UseContextualVoiceGuideVoiceOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsAbortRef = useRef<AbortController | null>(null)

  const stopAllAudio = useCallback(() => {
    try {
      if (ttsAbortRef.current) {
        try {
          ttsAbortRef.current.abort()
        } catch {
          // ignore
        }
        ttsAbortRef.current = null
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
        utteranceRef.current = null
      }

      setIsSpeaking(false)
    } catch {
      // ignore
    }
  }, [])

  const speakText = useCallback(
    async (text: string) => {
      if (!isAudioEnabled || typeof window === 'undefined') {
        return
      }

      const cleanedText = cleanContextualVoiceGuideSpeechText(text)
      if (!cleanedText) {
        return
      }

      stopAllAudio()

      try {
        setIsSpeaking(true)

        const controller = new AbortController()
        ttsAbortRef.current = controller

        const audioBlob = await requestTTSAudio(
          {
            text: cleanedText,
            voiceSettings: getElevenLabsVoiceSettings(undefined),
          },
          controller.signal
        )

        if (ttsAbortRef.current?.signal.aborted) {
          ttsAbortRef.current = null
          return
        }

        if (!audioBlob) {
          speakWithWebSpeech(
            cleanedText,
            utteranceRef,
            {
              lang: getContextualVoiceGuideSpeechLanguage(language),
              ...getWebSpeechVoiceSettings(undefined),
            },
            () => setIsSpeaking(false)
          )

          if (ttsAbortRef.current === controller) {
            ttsAbortRef.current = null
          }

          return
        }

        await playAudioBlob(audioBlob, audioRef, {
          onFinish: () => setIsSpeaking(false),
        })

        if (ttsAbortRef.current === controller) {
          ttsAbortRef.current = null
        }
      } catch (error) {
        if (!isTTSAbortError(error)) {
          console.error('Error en sintesis de voz contextual:', error)
        }
        setIsSpeaking(false)
      }
    },
    [isAudioEnabled, language, stopAllAudio]
  )

  useEffect(() => {
    if (!isVisible) {
      stopAllAudio()
    }

    return () => {
      stopAllAudio()
    }
  }, [isVisible, stopAllAudio])

  return {
    isSpeaking,
    speakText,
    stopAllAudio,
  }
}
