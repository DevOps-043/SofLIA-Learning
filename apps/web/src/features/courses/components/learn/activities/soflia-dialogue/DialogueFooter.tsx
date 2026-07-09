import type { Dispatch, SetStateAction } from "react";

import type { DialogueSession } from "./dialogue.types";
import { DialogueComposer } from "./DialogueComposer";
import { DialogueErrorMessage } from "./DialogueErrorMessage";
import { DialogueInactivityNotice } from "./DialogueInactivityNotice";
import { DialogueResultPanel } from "./DialogueResultPanel";
import { DialogueRetryButton } from "./DialogueRetryButton";

interface DialogueFooterProps {
  canPracticeAgain: boolean;
  canSendMessage: boolean;
  canStartNewAttempt: boolean;
  draftMessage: string;
  error: string | null;
  isTerminal: boolean;
  onDismissInactivityPrompt: () => void;
  onDraftMessageChange: Dispatch<SetStateAction<string>>;
  onRestartFromInactivity: () => void | Promise<void>;
  onRetrySession: () => void | Promise<void>;
  onSendMessage: () => void | Promise<void>;
  sending: boolean;
  session: DialogueSession | null;
  showInactivityPrompt: boolean;
}

export function DialogueFooter({
  canPracticeAgain,
  canSendMessage,
  canStartNewAttempt,
  draftMessage,
  error,
  isTerminal,
  onDismissInactivityPrompt,
  onDraftMessageChange,
  onRestartFromInactivity,
  onRetrySession,
  onSendMessage,
  sending,
  session,
  showInactivityPrompt,
}: DialogueFooterProps) {
  return (
    <div className="space-y-3 border-t border-gray-200 bg-gray-50/70 px-4 py-4 dark:border-white/10 dark:bg-white/[0.02]">
      <DialogueInactivityNotice
        onContinue={onDismissInactivityPrompt}
        onRestart={onRestartFromInactivity}
        sending={sending}
        show={showInactivityPrompt}
      />
      <DialogueResultPanel session={session} />
      <DialogueErrorMessage error={error} />
      <DialogueRetryButton canPracticeAgain={canPracticeAgain} canStartNewAttempt={canStartNewAttempt} onRetrySession={onRetrySession} sending={sending} />
      <DialogueComposer canSendMessage={canSendMessage} draftMessage={draftMessage} isTerminal={isTerminal} onDraftMessageChange={onDraftMessageChange} onSendMessage={onSendMessage} sending={sending} />
    </div>
  );
}
