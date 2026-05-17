import {
  FEMALE_VOICE_HINTS,
  MALE_VOICE_HINTS,
} from './voice-hints'

function scoreVoiceMatch(voice: SpeechSynthesisVoice, requestedLang: string): number {
  const voiceLang = (voice.lang || '').toLowerCase()
  const normalizedRequestedLang = requestedLang.toLowerCase()
  const requestedBaseLang = normalizedRequestedLang.split('-')[0] || normalizedRequestedLang
  const searchableName = `${voice.name} ${voice.voiceURI}`.toLowerCase()
  let score = 0

  if (voiceLang === normalizedRequestedLang) {
    score += 12
  } else if (voiceLang.startsWith(`${requestedBaseLang}-`) || voiceLang === requestedBaseLang) {
    score += 8
  }

  if (voice.localService) score += 2
  if (voice.default) score += 1
  if (FEMALE_VOICE_HINTS.some((hint) => searchableName.includes(hint))) score += 10
  if (MALE_VOICE_HINTS.some((hint) => searchableName.includes(hint))) score -= 10

  return score
}

export function selectPreferredWebSpeechVoice(
  voices: SpeechSynthesisVoice[],
  requestedLang: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) {
    return null
  }

  const normalizedRequestedLang = requestedLang.toLowerCase()
  const requestedBaseLang = normalizedRequestedLang.split('-')[0] || normalizedRequestedLang
  const languageMatches = voices.filter((voice) => {
    const voiceLang = (voice.lang || '').toLowerCase()
    return voiceLang === normalizedRequestedLang
      || voiceLang === requestedBaseLang
      || voiceLang.startsWith(`${requestedBaseLang}-`)
  })
  const candidateVoices = languageMatches.length > 0 ? languageMatches : voices
  const rankedVoices = [...candidateVoices].sort(
    (left, right) => scoreVoiceMatch(right, requestedLang) - scoreVoiceMatch(left, requestedLang),
  )

  return rankedVoices[0] || null
}
