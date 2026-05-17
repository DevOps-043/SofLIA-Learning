export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@')
  if (!username || !domain) return email

  const maskedUsername =
    username.length > 2
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : username

  return `${maskedUsername}@${domain}`
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}
