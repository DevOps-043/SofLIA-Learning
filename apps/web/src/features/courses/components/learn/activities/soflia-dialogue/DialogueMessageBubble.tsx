import type { DialogueMessage } from "./dialogue.types";
import { DialogueAvatar } from "./DialogueAvatar";

interface DialogueMessageBubbleProps {
  message: DialogueMessage;
  userDisplayName: string;
  userInitials: string;
  userProfilePictureUrl?: string | null;
}

export function DialogueMessageBubble({
  message,
  userDisplayName,
  userInitials,
  userProfilePictureUrl,
}: DialogueMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex min-w-0 gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <DialogueAvatar role={message.role} userDisplayName={userDisplayName} userInitials={userInitials} userProfilePictureUrl={userProfilePictureUrl} />
      )}
      <div
        className={`max-w-[88%] break-words rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md border-transparent"
            : "rounded-bl-md border-gray-200/70 bg-gray-50 text-gray-800 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/90"
        }`}
        style={isUser ? { backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' } : undefined}
      >
        <div
          className={`mb-0.5 text-[11px] font-semibold ${isUser ? "opacity-70" : ""}`}
          style={!isUser ? { color: 'var(--learn-accent)' } : undefined}
        >
          {isUser ? userDisplayName : "SofLIA"}
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      {isUser && (
        <DialogueAvatar role={message.role} userDisplayName={userDisplayName} userInitials={userInitials} userProfilePictureUrl={userProfilePictureUrl} />
      )}
    </div>
  );
}
