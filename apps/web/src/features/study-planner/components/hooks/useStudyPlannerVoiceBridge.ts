import type { MutableRefObject } from 'react';
import { useStudyPlannerVoiceInteraction } from '../../hooks/useStudyPlannerVoiceInteraction';

interface UseStudyPlannerVoiceBridgeParams {
  handleVoiceQuestionRef: MutableRefObject<(question: string) => Promise<void>>;
  isAudioEnabled: boolean;
  isProcessing: boolean;
}

export function useStudyPlannerVoiceBridge({
  handleVoiceQuestionRef,
  isAudioEnabled,
  isProcessing,
}: UseStudyPlannerVoiceBridgeParams) {
  return useStudyPlannerVoiceInteraction({
    isAudioEnabled,
    isProcessing,
    onTranscript: async (question: string) => {
      await handleVoiceQuestionRef.current(question);
    },
  });
}
