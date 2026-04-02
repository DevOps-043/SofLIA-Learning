import { describe, expect, it } from 'vitest'
import {
  cleanContextualVoiceGuideSpeechText,
  getContextualVoiceGuideSpeechLanguage,
} from '../services/contextual-voice-guide-voice.service'

describe('contextual-voice-guide-voice.service', () => {
  it('maps supported languages to speech locales', () => {
    expect(getContextualVoiceGuideSpeechLanguage('es')).toBe('es-ES')
    expect(getContextualVoiceGuideSpeechLanguage('en')).toBe('en-US')
    expect(getContextualVoiceGuideSpeechLanguage('pt')).toBe('pt-BR')
    expect(getContextualVoiceGuideSpeechLanguage('de')).toBe('es-ES')
  })

  it('cleans speech text before sending it to TTS', () => {
    expect(cleanContextualVoiceGuideSpeechText('  Hola   mundo  !  ')).toBe('Hola mundo!')
  })
})
