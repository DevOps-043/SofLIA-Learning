export interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
  /** Cuando false, oculta el boton de saltar. Default: true */
  isSkippable?: boolean;
  /**
   * Cuando true, si el video no se puede cargar se continua automaticamente
   * (llama onComplete) en lugar de mostrar el modal de error que bloquea.
   * Pensado para videos opcionales de onboarding/tour. Default: false.
   */
  skipOnError?: boolean;
}
