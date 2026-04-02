import type { OnboardingStep } from './types';

export function isLastOnboardingStep(currentStep: number, totalSteps: number): boolean {
  return currentStep >= totalSteps - 1;
}

export function getNextOnboardingStepIndex(currentStep: number, totalSteps: number): number {
  return Math.min(currentStep + 1, totalSteps - 1);
}

export function getPreviousOnboardingStepIndex(currentStep: number): number {
  return Math.max(currentStep - 1, 0);
}

export function shouldShowOnboardingStepAction(
  step: OnboardingStep,
  currentStep: number,
  totalSteps: number
): boolean {
  return Boolean(step.action) && !isLastOnboardingStep(currentStep, totalSteps);
}
