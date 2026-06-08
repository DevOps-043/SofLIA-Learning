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
        className={`relative max-w-[86%] break-words px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "rounded-2xl rounded-tr-sm bg-primary text-white after:absolute after:right-[-5px] after:top-4 after:h-3 after:w-3 after:rotate-45 after:bg-primary dark:bg-accent dark:text-primary dark:after:bg-accent"
            : "rounded-2xl rounded-tl-sm bg-gray-100 text-gray-800 before:absolute before:left-[-5px] before:top-4 before:h-3 before:w-3 before:rotate-45 before:bg-gray-100 dark:bg-white/10 dark:text-white dark:before:bg-white/10"
        }`}
      >
        <div className={`mb-1 text-[11px] font-semibold ${isUser ? "text-white/70 dark:text-primary/70" : "text-gray-500 dark:text-white/50"}`}>
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
