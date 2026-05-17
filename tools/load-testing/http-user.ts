import type { QaUser } from './types'

export function userIp(user?: QaUser) {
  if (!user) return undefined

  const third = Math.floor(user.index / 250)
  const fourth = (user.index % 250) + 1
  return `10.240.${third}.${fourth}`
}
