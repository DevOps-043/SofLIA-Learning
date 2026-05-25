export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let index = 0; index < length; index += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

export const generateFingerprint = (
  userAgent: string,
  screenResolution: string,
): string => {
  const data = `${userAgent}-${screenResolution}`
  return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
}
