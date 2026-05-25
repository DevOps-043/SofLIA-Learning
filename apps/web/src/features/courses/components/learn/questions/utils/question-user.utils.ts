import type { CourseQuestionUser } from "../types";

export function getQuestionUserDisplayName(user?: CourseQuestionUser | null) {
  if (!user) {
    return "Usuario";
  }

  if (user.display_name) {
    return user.display_name;
  }

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  return user.username || "Usuario";
}

export function getQuestionUserInitials(user?: CourseQuestionUser | null) {
  if (user?.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  }

  if (user?.username) {
    return user.username.charAt(0).toUpperCase();
  }

  return "U";
}

export function formatQuestionTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "hace un momento";
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000) {
    return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  }

  return date.toLocaleDateString();
}
