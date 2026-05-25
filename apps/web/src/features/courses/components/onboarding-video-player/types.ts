export interface OnboardingVideoPlayerProps {
  videos: string[];
  onComplete: () => void;
  /** Cuando false, oculta el boton de saltar. Default: true */
  isSkippable?: boolean;
}
