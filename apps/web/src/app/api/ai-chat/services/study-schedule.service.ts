export interface ScheduleChangeRequest {
  isScheduleChange: boolean
  proposedTime?: string
}

export interface StudyScheduleConfig {
  detected: boolean
  studyDays: string[]
  timeSlots: string[]
}

export interface ProposedScheduleSlot {
  date: string
  startTime: string
  endTime: string
}

const SCHEDULE_CHANGE_PATTERNS = [
  /cambia.*(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)/i,
  /a las (\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)/i,
  /mejor.*(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)/i,
  /prefiero.*(\d{1,2}(?::\d{2})?)\s*(am|pm|a\.m\.|p\.m\.)/i,
]

const DAY_PATTERNS: Record<string, string> = {
  lunes: 'lunes',
  martes: 'martes',
  miercoles: 'miércoles',
  jueves: 'jueves',
  viernes: 'viernes',
  sabado: 'sábado',
  domingo: 'domingo',
}

const TIME_SLOT_PATTERNS: Record<string, string> = {
  manana: 'mañana',
  'mañana': 'mañana',
  tarde: 'tarde',
  noche: 'noche',
}

function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function detectScheduleChangeRequest(message: string): ScheduleChangeRequest {
  for (const pattern of SCHEDULE_CHANGE_PATTERNS) {
    const match = message.match(pattern)
    if (match) {
      return {
        isScheduleChange: true,
        proposedTime: `${match[1]}${match[2]}`,
      }
    }
  }

  return { isScheduleChange: false }
}

export function detectStudyScheduleConfig(message: string): StudyScheduleConfig {
  const normalizedMessage = normalizeMessage(message)

  const studyDays = Object.entries(DAY_PATTERNS).reduce<string[]>((days, [pattern, dayName]) => {
    if (normalizedMessage.includes(pattern) && !days.includes(dayName)) {
      days.push(dayName)
    }

    return days
  }, [])

  const timeSlots = Object.entries(TIME_SLOT_PATTERNS).reduce<string[]>((slots, [pattern, slotName]) => {
    if (normalizedMessage.includes(pattern) && !slots.includes(slotName)) {
      slots.push(slotName)
    }

    return slots
  }, [])

  return {
    detected: studyDays.length > 0 && timeSlots.length > 0,
    studyDays,
    timeSlots,
  }
}

export function buildDefaultProposedSlots(
  proposedTime?: string,
  currentDate: Date = new Date()
): ProposedScheduleSlot[] {
  return [
    {
      date: currentDate.toISOString().split('T')[0],
      startTime: proposedTime || '08:00',
      endTime: '09:00',
    },
  ]
}
