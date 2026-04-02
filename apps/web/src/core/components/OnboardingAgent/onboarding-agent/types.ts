export interface OnboardingStepAction {
  label: string;
  path: string;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  speech: string;
  action?: OnboardingStepAction;
}
