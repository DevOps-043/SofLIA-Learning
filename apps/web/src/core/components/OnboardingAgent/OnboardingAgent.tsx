'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { OnboardingModal } from './onboarding-agent/OnboardingModal';
import { getNextOnboardingStepIndex, getPreviousOnboardingStepIndex } from './onboarding-agent/navigation';
import { useOnboardingAudio } from './onboarding-agent/useOnboardingAudio';
import { useOnboardingSteps } from './onboarding-agent/useOnboardingSteps';
import { useOnboardingVisibility } from './onboarding-agent/useOnboardingVisibility';
import { useDevicePerformanceMode } from '@/lib/utils/mobile-performance';

export function OnboardingAgent() {
  const steps = useOnboardingSteps();
  const performanceMode = useDevicePerformanceMode();
  const hasUserChangedAudioRef = useRef(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentStep, isVisible, markAsSeen, setCurrentStep, setIsVisible } = useOnboardingVisibility(pathname);
  const { isSpeaking, speakText, stopAllAudio } = useOnboardingAudio(isAudioEnabled);

  useEffect(() => {
    if (hasUserChangedAudioRef.current) {
      return;
    }

    setIsAudioEnabled(!performanceMode.disableAutoplayAudio);
  }, [performanceMode.disableAutoplayAudio]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (
      !isVisible ||
      currentStep !== 0 ||
      !isAudioEnabled ||
      performanceMode.disableAutoplayAudio
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void speakText(steps[0]?.speech ?? '');
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentStep, isAudioEnabled, isVisible, performanceMode.disableAutoplayAudio, speakText, steps]);

  const handleSkip = () => {
    stopAllAudio();
    markAsSeen();
    setIsVisible(false);
  };

  const handleComplete = () => {
    stopAllAudio();
    markAsSeen();
    setIsVisible(false);

    const lastStep = steps[steps.length - 1];
    if (lastStep?.action) {
      router.push(lastStep.action.path);
    }
  };

  const handleActionClick = () => {
    const step = steps[currentStep];
    if (!step?.action) {
      return;
    }

    stopAllAudio();
    markAsSeen();
    setIsVisible(false);
    router.push(step.action.path);
  };

  const handleNext = () => {
    stopAllAudio();

    const nextStep = getNextOnboardingStepIndex(currentStep, steps.length);
    if (nextStep === currentStep) {
      handleComplete();
      return;
    }

    setCurrentStep(nextStep);
    void speakText(steps[nextStep].speech);
  };

  const handlePrevious = () => {
    stopAllAudio();

    const previousStep = getPreviousOnboardingStepIndex(currentStep);
    setCurrentStep(previousStep);
    void speakText(steps[previousStep].speech);
  };

  const toggleAudio = () => {
    hasUserChangedAudioRef.current = true;
    const nextAudioState = !isAudioEnabled;
    setIsAudioEnabled(nextAudioState);

    if (!nextAudioState) {
      stopAllAudio();
      return;
    }

    void speakText(steps[currentStep].speech);
  };

  return (
    <OnboardingModal
      currentStep={currentStep}
      isAudioEnabled={isAudioEnabled}
      isMobile={isMobile}
      isSpeaking={isSpeaking}
      isVisible={isVisible}
      onActionClick={handleActionClick}
      onComplete={handleComplete}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      onToggleAudio={toggleAudio}
      steps={steps}
    />
  );
}
