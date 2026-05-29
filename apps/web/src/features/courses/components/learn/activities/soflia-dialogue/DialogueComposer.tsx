"use client";

import { useEffect, useMemo, useRef, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { useLanguage } from "@/core/providers/I18nProvider";
import { useThemeStore } from "@/core/stores/themeStore";
import { CourseLiaInputBar } from "@/features/courses/components/CourseLia/components/CourseLiaInputBar";
import { VoiceErrorBanner } from "@/features/courses/components/CourseLia/components/VoiceErrorBanner";
import { useCourseLiaSpeechInput } from "@/features/courses/components/CourseLia/hooks/useCourseLiaSpeechInput";
import type { CourseLiaThemeColors, PrimaryActionMode } from "@/features/courses/components/CourseLia/types";

interface DialogueComposerProps {
  canSendMessage: boolean;
  draftMessage: string;
  isTerminal: boolean;
  onDraftMessageChange: Dispatch<SetStateAction<string>>;
  onSendMessage: () => void | Promise<void>;
  sending: boolean;
}

export function DialogueComposer({
  canSendMessage,
  draftMessage,
  isTerminal,
  onDraftMessageChange,
  onSendMessage,
  sending,
}: DialogueComposerProps) {
  const { t } = useTranslation("learn");
  const { language } = useLanguage();
  const { resolvedTheme } = useThemeStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLightTheme = resolvedTheme === "light";
  const isInteractionBlocked = sending || isTerminal;
  const themeColors = useMemo<CourseLiaThemeColors>(
    () => ({
      accentColor: "var(--color-accent)",
      assistantLinkColor: "var(--color-accent)",
      borderColor: isLightTheme ? "var(--color-gray-200)" : "rgba(255,255,255,0.1)",
      headerBg: "transparent",
      inputBg: isLightTheme ? "var(--color-bg-light)" : "rgba(15,20,25,0.72)",
      inputBorder: isLightTheme ? "var(--color-gray-200)" : "rgba(255,255,255,0.16)",
      messageBubbleAssistant: "transparent",
      messageBubbleUser: "transparent",
      panelBg: "transparent",
      primaryAction: "var(--color-accent)",
      textPrimary: isLightTheme ? "var(--color-gray-900)" : "var(--color-bg-light)",
      textSecondary: isLightTheme ? "var(--color-gray-500)" : "rgba(255,255,255,0.55)",
    }),
    [isLightTheme],
  );
  const {
    isListening,
    setVoiceError,
    toggleListening,
    voiceError,
  } = useCourseLiaSpeechInput({
    inputRef,
    isLoading: isInteractionBlocked,
    language,
    setInputValue: onDraftMessageChange,
    t,
  });
  const hasDraftMessage = Boolean(draftMessage.trim());
  const primaryActionMode: PrimaryActionMode = hasDraftMessage ? "send" : "voice";
  const primaryActionLabel = hasDraftMessage
    ? t("activities.dialogue.send")
    : isListening
      ? t("lia.voice.stopDictation")
      : t("lia.voice.startDictation");

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 120 ? "auto" : "hidden";
  }, [draftMessage]);

  const handlePrimaryAction = () => {
    if (hasDraftMessage) {
      if (canSendMessage) {
        void onSendMessage();
      }
      return;
    }

    void toggleListening();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();

    if (canSendMessage) {
      void onSendMessage();
    }
  };

  return (
    <>
      <VoiceErrorBanner
        isLightTheme={isLightTheme}
        message={voiceError}
        onDismiss={() => setVoiceError(null)}
      />
      <CourseLiaInputBar
        inputClassName="lia-input-reset soflia-dialogue-input"
        inputId="soflia-dialogue-composer-input"
        inputRef={inputRef}
        inputValue={draftMessage}
        isInteractionBlocked={isInteractionBlocked}
        isLightTheme={isLightTheme}
        isListening={isListening}
        isMobile={false}
        onInputChange={onDraftMessageChange}
        onKeyDown={handleKeyDown}
        onPrimaryAction={handlePrimaryAction}
        placeholder={isTerminal ? t("activities.dialogue.closedPlaceholder") : t("activities.dialogue.placeholder")}
        primaryActionLabel={primaryActionLabel}
        primaryActionMode={primaryActionMode}
        themeColors={themeColors}
      />
      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-white/40">
        {isTerminal ? t("activities.dialogue.closedHelper") : t("activities.dialogue.helper")}
      </p>
    </>
  );
}
