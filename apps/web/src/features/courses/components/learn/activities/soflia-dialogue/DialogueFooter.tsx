import type { DialogueSession } from "./dialogue.types";
import { DialogueComposer } from "./DialogueComposer";
import { DialogueErrorMessage } from "./DialogueErrorMessage";
import { DialogueResultPanel } from "./DialogueResultPanel";
import { DialogueRetryButton } from "./DialogueRetryButton";

interface DialogueFooterProps {
  canPracticeAgain: boolean;
  canSendMessage: boolean;
  canStartNewAttempt: boolean;
  draftMessage: string;
  error: string | null;
  isTerminal: boolean;
  onDraftMessageChange: (message: string) => void;
  onRetrySession: () => void | Promise<void>;
  onSendMessage: () => void | Promise<void>;
  sending: boolean;
  session: DialogueSession | null;
}

export function DialogueFooter({
  canPracticeAgain,
  canSendMessage,
  canStartNewAttempt,
  draftMessage,
  error,
  isTerminal,
  onDraftMessageChange,
  onRetrySession,
  onSendMessage,
  sending,
  session,
}: DialogueFooterProps) {
  return (
    <div className="space-y-3 border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
      <DialogueResultPanel session={session} />
      <DialogueErrorMessage error={error} />
      <DialogueRetryButton canPracticeAgain={canPracticeAgain} canStartNewAttempt={canStartNewAttempt} onRetrySession={onRetrySession} sending={sending} />
      <DialogueComposer canSendMessage={canSendMessage} draftMessage={draftMessage} isTerminal={isTerminal} onDraftMessageChange={onDraftMessageChange} onSendMessage={onSendMessage} sending={sending} />
    </div>
  );
}
