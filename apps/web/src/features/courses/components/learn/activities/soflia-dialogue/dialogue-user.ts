type DialogueUser = {
  display_name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
} | null;

export function getUserDisplayName(user: DialogueUser) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return fullName || user?.display_name || user?.username || user?.email || "";
}

export function getUserInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : displayName.slice(0, 2);

  return initials.toUpperCase() || "U";
}
