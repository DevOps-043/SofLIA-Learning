interface LessonLike {
  lessonTitle: string
  durationMinutes: number
}

interface PreferencesLike {
  days: string[]
  times: string[]
  startDate?: string
}

interface StudyBlockLike<TLesson extends LessonLike = LessonLike> {
  lessons: TLesson[]
  totalDuration: number
  mainLessonNum?: string
}

export function groupLessons<TLesson extends LessonLike>(
  lessons: TLesson[],
): StudyBlockLike<TLesson>[] {
  const blocks: StudyBlockLike<TLesson>[] = []
  let currentBlock: StudyBlockLike<TLesson> | null = null

  for (const lesson of lessons) {
    const title = lesson.lessonTitle.trim()
    const match =
      title.match(/^(?:Lecci[Ã³o]n\s+)?(\d+)(?:\.(\d+))?/i)
      || title.match(/^(\d+)(?:\.(\d+))?/)

    if (match) {
      const mainNum = match[1]

      if (currentBlock && currentBlock.mainLessonNum === mainNum) {
        currentBlock.lessons.push(lesson)
        currentBlock.totalDuration += lesson.durationMinutes
      } else {
        if (currentBlock) {
          blocks.push(currentBlock)
        }

        currentBlock = {
          lessons: [lesson],
          totalDuration: lesson.durationMinutes,
          mainLessonNum: mainNum,
        }
      }
      continue
    }

    if (currentBlock) {
      blocks.push(currentBlock)
    }

    currentBlock = {
      lessons: [lesson],
      totalDuration: lesson.durationMinutes,
      mainLessonNum: undefined,
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock)
  }

  return blocks
}

export function generateTimeSlots(
  prefs: PreferencesLike,
  minSlotsNeeded: number,
): { date: Date; time: string; period: string }[] {
  const slots: { date: Date; time: string; period: string }[] = []
  const start = new Date(prefs.startDate || new Date())

  const dayMap: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    'miÃ©rcoles': 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    'sÃ¡bado': 6,
  }

  const targetDays = prefs.days
    .map((day) => dayMap[day.toLowerCase().trim()])
    .filter((day) => day !== undefined)

  if (targetDays.length === 0) {
    targetDays.push(1, 2, 3, 4, 5)
  }

  const timeMap: Record<string, string> = {
    'maÃ±ana': '08:00',
    tarde: '14:00',
    noche: '20:00',
  }
  const targetTimes = prefs.times.map((time) => ({
    period: time.toLowerCase(),
    time: timeMap[time.toLowerCase()] || '09:00',
  }))

  if (targetTimes.length === 0) {
    targetTimes.push({ period: 'maÃ±ana', time: '09:00' })
  }

  const currentDate = new Date(start)
  if (currentDate.getHours() > 18) {
    currentDate.setDate(currentDate.getDate() + 1)
  }
  currentDate.setHours(0, 0, 0, 0)

  let iterations = 0
  while (slots.length < minSlotsNeeded && iterations < 730) {
    const dayOfWeek = currentDate.getDay()

    if (targetDays.includes(dayOfWeek)) {
      for (const timeConfig of targetTimes) {
        const slotDate = new Date(currentDate)
        slots.push({ date: slotDate, time: timeConfig.time, period: timeConfig.period })

        if (slots.length >= minSlotsNeeded) {
          break
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1)
    iterations += 1
  }

  return slots
}

export function getWeekNumber(date: Date, startDate: Date): number {
  const diff = date.getTime() - startDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7))
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
