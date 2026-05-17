import { useActivityWelcomeMessage } from './useActivityWelcomeMessage';
import { useCourseLiaBase } from './useCourseLiaBase';
import { useCourseLiaNavigationAction } from './useCourseLiaNavigationAction';
import { useCourseLiaPanelEffects } from './useCourseLiaPanelEffects';
import { useCourseLiaRegistration } from './useCourseLiaRegistration';
import { useCourseLiaSpeechInput } from './useCourseLiaSpeechInput';
import { useCourseLiaSuggestions } from './useCourseLiaSuggestions';
import { useMessageCopyAction } from './useMessageCopyAction';
import { useMessageEditActions } from './useMessageEditActions';
import { useMessageSendActions } from './useMessageSendActions';
import { useSuggestionClickAction } from './useSuggestionClickAction';
import { useTextareaAutosize } from './useTextareaAutosize';
import type { CourseLiaProps, PrimaryActionMode } from '../types';

export function useCourseLiaController(props: CourseLiaProps) {
  const base = useCourseLiaBase(props);
  const { messages, isLoading, sendMessage, editMessageAndRegenerate, stop, clearHistory } = base.liaChat;
  const speech = useCourseLiaSpeechInput({
    inputRef: base.inputRef,
    isLoading,
    language: base.language,
    setInputValue: base.setInputValue,
    t: base.t,
  });
  const suggestions = useCourseLiaSuggestions({
    currentActivity: base.currentActivity,
    isOpen: base.isOpen,
    resolvedLessonContext: base.resolvedLessonContext,
  });

  useTextareaAutosize(base);
  useCourseLiaRegistration(base);
  useCourseLiaPanelEffects({ ...base, messages, stop });
  useActivityWelcomeMessage({
    clearHistory,
    currentActivity: base.currentActivity,
    isOpen: base.isOpen,
    prevActivityTriggerRef: base.prevActivityTriggerRef,
    resolvedLessonContext: base.resolvedLessonContext,
    sendMessage,
  });

  const handleLinkClick = useCourseLiaNavigationAction(base.router);
  const handleSuggestionClick = useSuggestionClickAction({
    isLoading,
    markSuggestionUsed: suggestions.markUsed,
    resolvedLessonContext: base.resolvedLessonContext,
    sendMessage,
  });
  const handleCopyMessage = useMessageCopyAction(base);
  const editActions = useMessageEditActions({ ...base, editMessageAndRegenerate, isLoading });
  const sendActions = useMessageSendActions({
    ...base,
    isListening: speech.isListening,
    isLoading,
    liaChat: base.liaChat,
    sendMessage,
    stop,
    toggleListening: speech.toggleListening,
  });
  const hasInputText = Boolean(base.inputValue.trim());
  const primaryActionMode: PrimaryActionMode = isLoading ? 'stop' : hasInputText ? 'send' : 'voice';
  const primaryActionLabel = isLoading
    ? base.t('lia.stopGeneration')
    : hasInputText
      ? base.t('lia.send')
      : speech.isListening
        ? base.t('lia.voice.stopDictation')
        : base.t('lia.voice.startDictation');

  return {
    ...base,
    ...speech,
    ...editActions,
    ...sendActions,
    clearHistory,
    handleCopyMessage,
    handleLinkClick,
    handleSuggestionClick,
    isLoading,
    isLoadingSuggestions: suggestions.isLoading,
    lessonSuggestions: suggestions.suggestions,
    messages,
    primaryActionLabel,
    primaryActionMode,
    stop,
  };
}
