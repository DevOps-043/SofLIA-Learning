export interface StudyPlannerIntroOverlayProps {
  isVisible: boolean
  showResumePrompt: boolean
  savedSessionDate: string | null
  currentStep: number
  isMobile: boolean
  isSpeaking: boolean
  isAudioEnabled: boolean
  isListening: boolean
  isProcessing: boolean
  onToggleAudio: () => void
  onSkip: () => void
  onDiscardSession: () => void
  onResumeSession: () => void
  onToggleListening: () => void
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
}
