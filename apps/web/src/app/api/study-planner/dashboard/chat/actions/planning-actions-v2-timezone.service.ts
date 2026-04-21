const DEFAULT_TZ_OFFSET = '-06:00'

export function hasTimezoneOffset(timestamp: string): boolean {
  return (
    timestamp.includes('+')
    || timestamp.includes('Z')
    || /-\d{2}:\d{2}$/.test(timestamp)
  )
}

export function withTimezoneOffset(timestamp: string): string {
  if (hasTimezoneOffset(timestamp)) {
    return timestamp
  }

  return `${timestamp}${DEFAULT_TZ_OFFSET}`
}
