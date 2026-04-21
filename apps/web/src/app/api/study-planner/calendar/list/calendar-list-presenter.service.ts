import type { CalendarListItem } from '../../../../../features/study-planner/types/user-context.types'

interface ProviderCalendarLike {
  id: string
  name: string
  rawPrimary: boolean
}

function normalizeIdentity(value?: string | null): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized || null
}

function resolveConnectedPrimaryIds<T extends ProviderCalendarLike>(
  calendars: T[],
  accountEmail?: string | null,
): Set<string> {
  const normalizedAccountEmail = normalizeIdentity(accountEmail)

  if (normalizedAccountEmail) {
    const matchedIds = calendars
      .filter((calendar) => {
        const normalizedId = normalizeIdentity(calendar.id)
        const normalizedName = normalizeIdentity(calendar.name)

        return normalizedId === normalizedAccountEmail || normalizedName === normalizedAccountEmail
      })
      .map((calendar) => calendar.id)

    if (matchedIds.length > 0) {
      return new Set(matchedIds)
    }
  }

  return new Set(
    calendars
      .filter((calendar) => calendar.rawPrimary)
      .map((calendar) => calendar.id),
  )
}

export function sortCalendarListItems(calendars: CalendarListItem[]): CalendarListItem[] {
  return [...calendars].sort((left, right) => {
    if (!!left.isConnectedAccountPrimary !== !!right.isConnectedAccountPrimary) {
      return left.isConnectedAccountPrimary ? -1 : 1
    }

    if (!!left.isPrimary !== !!right.isPrimary) {
      return left.isPrimary ? -1 : 1
    }

    return left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })
  })
}

export function resolveDefaultSelectedCalendarIds(
  calendars: Array<{ id: string; isConnectedAccountPrimary?: boolean; isPrimary: boolean }>,
): string[] {
  const primaryCalendar = calendars.find((calendar) => calendar.isConnectedAccountPrimary)
    || calendars.find((calendar) => calendar.isPrimary)

  if (primaryCalendar) {
    return [primaryCalendar.id]
  }

  return calendars.length > 0 ? [calendars[0].id] : []
}

export function buildGoogleCalendarListItems(params: {
  accountEmail?: string | null
  calendars: Array<{
    id: string
    summary: string
    primary: boolean
    accessRole: string
    backgroundColor?: string
  }>
  providerAccountId: string
}): CalendarListItem[] {
  const connectedPrimaryIds = resolveConnectedPrimaryIds(
    params.calendars.map((calendar) => ({
      id: calendar.id,
      name: calendar.summary,
      rawPrimary: calendar.primary,
    })),
    params.accountEmail,
  )

  return params.calendars.map((calendar) => ({
    accountEmail: params.accountEmail || undefined,
    id: calendar.id,
    isConnectedAccountPrimary: connectedPrimaryIds.has(calendar.id),
    isPrimary: calendar.primary,
    name: calendar.summary,
    accessRole: calendar.accessRole as CalendarListItem['accessRole'],
    color: calendar.backgroundColor,
    provider: 'google',
    providerAccountId: params.providerAccountId,
    source: 'google',
  }))
}

export function buildMicrosoftCalendarListItems(params: {
  accountEmail?: string | null
  calendars: Array<{
    id: string
    name: string
    isDefaultCalendar: boolean
    canEdit: boolean
    color?: string
  }>
  providerAccountId: string
}): CalendarListItem[] {
  const connectedPrimaryIds = resolveConnectedPrimaryIds(
    params.calendars.map((calendar) => ({
      id: calendar.id,
      name: calendar.name,
      rawPrimary: calendar.isDefaultCalendar,
    })),
    params.accountEmail,
  )

  return params.calendars.map((calendar) => ({
    accountEmail: params.accountEmail || undefined,
    id: calendar.id,
    isConnectedAccountPrimary: connectedPrimaryIds.has(calendar.id),
    isPrimary: calendar.isDefaultCalendar,
    name: calendar.name,
    accessRole: (calendar.canEdit ? 'writer' : 'reader') as CalendarListItem['accessRole'],
    color: calendar.color,
    provider: 'microsoft',
    providerAccountId: params.providerAccountId,
    source: 'microsoft',
  }))
}
