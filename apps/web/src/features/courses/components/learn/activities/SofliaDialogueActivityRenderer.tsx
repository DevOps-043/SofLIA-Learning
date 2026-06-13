"use client";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DialogueFooter } from "./soflia-dialogue/DialogueFooter";
import { DialogueHeader } from "./soflia-dialogue/DialogueHeader";
import { DialogueLoadingState } from "./soflia-dialogue/DialogueLoadingState";
import { DialogueMessagesList } from "./soflia-dialogue/DialogueMessagesList";
import { getUserDisplayName, getUserInitials } from "./soflia-dialogue/dialogue-user";
import type { SofliaDialogueActivityRendererProps } from "./soflia-dialogue/dialogue.types";
import { useSofliaDialogueSession } from "./soflia-dialogue/useSofliaDialogueSession";

export function SofliaDialogueActivityRenderer({
  activity,
  lessonId,
  onSessionUpdated,
  slug,
}: SofliaDialogueActivityRendererProps) {
  const { t } = useTranslation("learn");
  const { user } = useAuth();
  const dialogue = useSofliaDialogueSession({
    activityId: activity.activity_id,
    lessonId,
    onSessionUpdated,
    slug,
  });
  const userDisplayName = getUserDisplayName(user) || t("activities.dialogue.userLabel");
  const userInitials = getUserInitials(userDisplayName);

  if (dialogue.loading) {
    return <DialogueLoadingState />;
  }

  return (
    // `-m-3` cancela el padding de la tarjeta contenedora (ActivityCardBody) para que
    // el diálogo la llene de borde a borde: una sola capa, sin "card dentro de card".
    <div className="-m-3 overflow-hidden rounded-lg">
      <DialogueHeader
        canPracticeAgain={dialogue.canPracticeAgain}
        canRetry={dialogue.canRetry}
        criteriaProgress={dialogue.criteriaProgress}
        scoreValue={dialogue.scoreValue}
        session={dialogue.session}
        stateLabel={dialogue.stateLabel}
        totalCriteria={dialogue.totalCriteria}
      />
      <DialogueMessagesList
        messagesEndRef={dialogue.messagesEndRef}
        sending={dialogue.sending}
        session={dialogue.session}
        userDisplayName={userDisplayName}
        userInitials={userInitials}
        userProfilePictureUrl={user?.profile_picture_url}
      />
      <DialogueFooter
        canPracticeAgain={dialogue.canPracticeAgain}
        canSendMessage={dialogue.canSendMessage}
        canStartNewAttempt={dialogue.canStartNewAttempt}
        draftMessage={dialogue.draftMessage}
        error={dialogue.error}
        isTerminal={dialogue.isTerminal}
        onDraftMessageChange={dialogue.setDraftMessage}
        onRetrySession={dialogue.retrySession}
        onSendMessage={dialogue.sendMessage}
        sending={dialogue.sending}
        session={dialogue.session}
      />
    </div>
  );
}
