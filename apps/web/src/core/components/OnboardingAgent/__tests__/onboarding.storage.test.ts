import { describe, expect, it, vi } from 'vitest';
import {
  clearOnboardingSeen,
  hasSeenOnboarding,
  markOnboardingAsSeen,
  shouldAutoOpenOnboarding,
} from '../onboarding-agent/storage';
import {
  getNextOnboardingStepIndex,
  getPreviousOnboardingStepIndex,
  isLastOnboardingStep,
  shouldShowOnboardingStepAction,
} from '../onboarding-agent/navigation';

describe('onboarding storage', () => {
  it('marks onboarding as seen and reads it back', () => {
    const storage = {
      getItem: vi.fn(() => 'true'),
      setItem: vi.fn(),
    };

    markOnboardingAsSeen(storage);

    expect(storage.setItem).toHaveBeenCalledWith('has-seen-onboarding', 'true');
    expect(hasSeenOnboarding(storage)).toBe(true);
  });

  it('clears onboarding marker', () => {
    const storage = {
      removeItem: vi.fn(),
    };

    clearOnboardingSeen(storage);

    expect(storage.removeItem).toHaveBeenCalledWith('has-seen-onboarding');
  });

  it('opens onboarding only on dashboard when unseen', () => {
    expect(shouldAutoOpenOnboarding('/dashboard', { getItem: () => null })).toBe(true);
    expect(shouldAutoOpenOnboarding('/courses', { getItem: () => null })).toBe(false);
    expect(shouldAutoOpenOnboarding('/dashboard', { getItem: () => 'true' })).toBe(false);
  });
});

describe('onboarding navigation', () => {
  it('caps next step at the last step', () => {
    expect(getNextOnboardingStepIndex(0, 4)).toBe(1);
    expect(getNextOnboardingStepIndex(3, 4)).toBe(3);
  });

  it('caps previous step at zero', () => {
    expect(getPreviousOnboardingStepIndex(0)).toBe(0);
    expect(getPreviousOnboardingStepIndex(3)).toBe(2);
  });

  it('evaluates last step and action visibility correctly', () => {
    expect(isLastOnboardingStep(3, 4)).toBe(true);
    expect(
      shouldShowOnboardingStepAction(
        {
          id: 2,
          title: 'Title',
          description: 'Description',
          speech: 'Speech',
          action: { label: 'Action', path: '/dashboard' },
        },
        1,
        4
      )
    ).toBe(true);
    expect(
      shouldShowOnboardingStepAction(
        {
          id: 4,
          title: 'Title',
          description: 'Description',
          speech: 'Speech',
          action: { label: 'Action', path: '/dashboard' },
        },
        3,
        4
      )
    ).toBe(false);
  });
});
