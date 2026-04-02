'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OPEN_ONBOARDING_EVENT } from './constants';
import { markOnboardingAsSeen, shouldAutoOpenOnboarding } from './storage';

export function useOnboardingVisibility(pathname: string) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const hasAttemptedOpenRef = useRef(false);
  const isOpeningRef = useRef(false);

  const openOnboarding = useCallback(() => {
    hasAttemptedOpenRef.current = false;
    isOpeningRef.current = true;
    setCurrentStep(0);
    setIsVisible(true);

    window.setTimeout(() => {
      isOpeningRef.current = false;
    }, 100);
  }, []);

  const markAsSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      markOnboardingAsSeen(window.localStorage);
    }
    hasAttemptedOpenRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isOpeningRef.current || hasAttemptedOpenRef.current || isVisible) {
      return;
    }

    if (!shouldAutoOpenOnboarding(pathname, window.localStorage)) {
      hasAttemptedOpenRef.current = true;
      return;
    }

    hasAttemptedOpenRef.current = true;
    isOpeningRef.current = true;

    const timer = window.setTimeout(() => {
      if (shouldAutoOpenOnboarding(pathname, window.localStorage) && !isVisible) {
        setIsVisible(true);
      }
      isOpeningRef.current = false;
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isVisible, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOpenOnboarding = () => {
      openOnboarding();
    };

    window.addEventListener(OPEN_ONBOARDING_EVENT, handleOpenOnboarding);

    return () => {
      window.removeEventListener(OPEN_ONBOARDING_EVENT, handleOpenOnboarding);
    };
  }, [openOnboarding]);

  return {
    currentStep,
    isVisible,
    markAsSeen,
    setCurrentStep,
    setIsVisible,
  };
}
