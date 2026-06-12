interface DialogueAvatarProps {
  role: "assistant" | "system" | "user";
  userDisplayName: string;
  userInitials: string;
  userProfilePictureUrl?: string | null;
}

export function DialogueAvatar({
  role,
  userDisplayName,
  userInitials,
  userProfilePictureUrl,
}: DialogueAvatarProps) {
  if (role !== "user") {
    return (
      <div className="mt-1 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-accent/30">
        <img src="/lia-avatar.webp" alt="SofLIA" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (userProfilePictureUrl) {
    return <img src={userProfilePictureUrl} alt={userDisplayName} className="mt-1 h-8 w-8 flex-shrink-0 rounded-full object-cover" />;
  }

  return (
    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary dark:bg-accent/15 dark:text-accent">
      {userInitials}
    </div>
  );
}
