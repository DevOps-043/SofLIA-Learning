import { describe, expect, it } from 'vitest'
import {
  getDefaultNotificationChannels,
  isNotificationChannel,
  normalizeNotificationChannels,
} from '../notification/catalog'

describe('notification catalog', () => {
  it('normalizes supported channels and drops unknown values', () => {
    expect(
      normalizeNotificationChannels(['in_app', 'whatsapp', 'fax', 'whatsapp']),
    ).toEqual(['in_app', 'whatsapp'])
    expect(isNotificationChannel('whatsapp')).toBe(true)
    expect(isNotificationChannel('fax')).toBe(false)
  })

  it('defines whatsapp delivery for certificate and daily learning summaries', () => {
    expect(getDefaultNotificationChannels('certificate_generated')).toEqual([
      'in_app',
      'whatsapp',
    ])
    expect(getDefaultNotificationChannels('learning_daily_summary')).toEqual([
      'in_app',
      'whatsapp',
    ])
  })

  it('keeps unusual login in-app only by default', () => {
    expect(getDefaultNotificationChannels('system_login_unusual')).toEqual(['in_app'])
  })
})
