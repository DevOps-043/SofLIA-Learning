import { StudySessionRow } from './types'

// SOFIA palette values — must match CSS variables in globals.css.
// Used as chart data colors (server-side), so CSS vars are not available here.
const SOFIA_WARNING  = '#F59E0B' // --color-warning
const SOFIA_ACCENT   = '#00D4B3' // --color-accent
const SOFIA_SUCCESS  = '#10B981' // --color-success
const SOFIA_GRAY_500 = '#6C757D' // --color-gray-500

const SLOT_COLORS = [SOFIA_WARNING, SOFIA_ACCENT, SOFIA_SUCCESS, SOFIA_GRAY_500]
const DAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function calculatePreferredTimeSlots(sessions: StudySessionRow[]) {
  const slots = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  sessions.forEach((session) => {
    const hour = new Date(session.start_time).getHours()
    if (hour >= 6 && hour < 12) slots.morning += 1
    else if (hour >= 12 && hour < 18) slots.afternoon += 1
    else if (hour >= 18 && hour < 24) slots.evening += 1
    else slots.night += 1
  })

  const total = sessions.length || 1
  return [
    { periodo: 'Manana (6am-12pm)', porcentaje: Math.round((slots.morning / total) * 100), color: SLOT_COLORS[0] },
    { periodo: 'Tarde (12pm-6pm)', porcentaje: Math.round((slots.afternoon / total) * 100), color: SLOT_COLORS[1] },
    { periodo: 'Noche (6pm-12am)', porcentaje: Math.round((slots.evening / total) * 100), color: SLOT_COLORS[2] },
    { periodo: 'Madrugada (12am-6am)', porcentaje: Math.round((slots.night / total) * 100), color: SLOT_COLORS[3] },
  ]
}

export function calculateActiveDays(sessions: StudySessionRow[]) {
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]
  sessions.forEach((session) => {
    dayCounts[new Date(session.start_time).getDay()] += 1
  })

  return DAY_NAMES.map((day, index) => ({ dia: day, sesiones: dayCounts[index] }))
}
