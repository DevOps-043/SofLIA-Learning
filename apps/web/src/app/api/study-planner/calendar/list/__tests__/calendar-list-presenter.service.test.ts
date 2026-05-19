import { describe, expect, it } from 'vitest'
import {
  buildGoogleCalendarListItems,
  resolveDefaultSelectedCalendarIds,
  sortCalendarListItems,
} from '../calendar-list-presenter.service'

describe('calendar-list-presenter.service', () => {
  it('prioritizes the connected account identity over a stale raw primary flag', () => {
    const calendars = buildGoogleCalendarListItems({
      accountEmail: 'israel.martinez@pulsehub.mx',
      calendars: [
        {
          id: 'fernando.suarez@pulsehub.mx',
          summary: 'fernando.suarez@pulsehub.mx',
          primary: true,
          accessRole: 'owner',
          backgroundColor: 'var(--color-black)',
        },
        {
          id: 'israel.martinez@pulsehub.mx',
          summary: 'israel.martinez@pulsehub.mx',
          primary: false,
          accessRole: 'owner',
          backgroundColor: 'var(--color-bg-light)',
        },
      ],
      providerAccountId: 'israel.martinez@pulsehub.mx',
    })

    expect(calendars.find((calendar) => calendar.id === 'israel.martinez@pulsehub.mx')?.isConnectedAccountPrimary).toBe(true)
    expect(calendars.find((calendar) => calendar.id === 'fernando.suarez@pulsehub.mx')?.isConnectedAccountPrimary).toBe(false)
  })

  it('defaults selection to the connected account primary calendar', () => {
    const selectedIds = resolveDefaultSelectedCalendarIds([
      {
        id: 'fernando.suarez@pulsehub.mx',
        name: 'Fernando',
        isPrimary: true,
        isConnectedAccountPrimary: false,
        accessRole: 'owner',
        provider: 'google',
      },
      {
        id: 'israel.martinez@pulsehub.mx',
        name: 'Israel',
        isPrimary: false,
        isConnectedAccountPrimary: true,
        accessRole: 'owner',
        provider: 'google',
      },
    ])

    expect(selectedIds).toEqual(['israel.martinez@pulsehub.mx'])
  })

  it('sorts the connected account primary calendar to the top', () => {
    const sorted = sortCalendarListItems([
      {
        id: 'b',
        name: 'Beta',
        isPrimary: false,
        accessRole: 'owner',
        provider: 'google',
      },
      {
        id: 'a',
        name: 'Alpha',
        isPrimary: false,
        isConnectedAccountPrimary: true,
        accessRole: 'owner',
        provider: 'google',
      },
    ])

    expect(sorted.map((calendar) => calendar.id)).toEqual(['a', 'b'])
  })
})
