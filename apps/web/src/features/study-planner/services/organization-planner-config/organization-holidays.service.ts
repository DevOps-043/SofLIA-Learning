import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../../lib/supabase/server'
import type { OrganizationHoliday } from './organization-planner-config.types'

interface OrganizationHolidayRow {
  id: string
  holiday_date: string
  name: string
  type: string
  is_recurring: boolean
}

function mapHoliday(row: OrganizationHolidayRow, date: string): OrganizationHoliday {
  return {
    id: row.id,
    date,
    name: row.name,
    type: row.type as 'official' | 'internal',
    isRecurring: row.is_recurring,
  }
}

function expandRecurringHoliday(
  row: OrganizationHolidayRow,
  startDate: Date,
  endDate: Date,
): OrganizationHoliday[] {
  const holidayDate = new Date(row.holiday_date)
  const month = holidayDate.getMonth()
  const day = holidayDate.getDate()
  const holidays: OrganizationHoliday[] = []

  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year += 1) {
    const candidate = new Date(year, month, day)
    if (candidate >= startDate && candidate <= endDate) {
      holidays.push(mapHoliday(row, candidate.toISOString().split('T')[0]))
    }
  }

  return holidays
}

export async function getOrganizationHolidays(
  organizationId: string,
  startDate: Date,
  endDate: Date,
): Promise<OrganizationHoliday[]> {
  const supabase = await createClient()
  const isoStart = startDate.toISOString().split('T')[0]
  const isoEnd = endDate.toISOString().split('T')[0]
  const [fixedResult, recurringResult] = await Promise.all([
    supabase
      .from('organization_holidays')
      .select('id, holiday_date, name, type, is_recurring')
      .eq('organization_id', organizationId)
      .eq('is_recurring', false)
      .gte('holiday_date', isoStart)
      .lte('holiday_date', isoEnd),
    supabase
      .from('organization_holidays')
      .select('id, holiday_date, name, type, is_recurring')
      .eq('organization_id', organizationId)
      .eq('is_recurring', true),
  ])

  if (fixedResult.error) {
    techDebtLogger.error('[OrganizationPlannerConfigService] Error fetching fixed holidays:', fixedResult.error)
  }

  if (recurringResult.error) {
    techDebtLogger.error('[OrganizationPlannerConfigService] Error fetching recurring holidays:', recurringResult.error)
  }

  const fixedHolidays = (fixedResult.data ?? []).map((holiday) => mapHoliday(holiday, holiday.holiday_date))
  const recurringHolidays = (recurringResult.data ?? []).flatMap((holiday) =>
    expandRecurringHoliday(holiday, startDate, endDate),
  )

  return [...fixedHolidays, ...recurringHolidays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
}
