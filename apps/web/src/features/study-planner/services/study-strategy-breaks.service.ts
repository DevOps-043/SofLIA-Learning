import {
  DEFAULT_STUDY_STRATEGY_CONFIGS,
  type BreakConfig,
  type BreakInterval,
  type SessionBreakdown,
  type StudyMode,
} from './study-strategy.types'

export function getStudyStrategyConfig(
  mode: StudyMode,
  customConfig?: Partial<BreakConfig>,
): BreakConfig {
  return {
    ...DEFAULT_STUDY_STRATEGY_CONFIGS[mode],
    ...customConfig,
  }
}

export function calculatePomodoroBreaks(
  sessionMinutes: number,
  config?: Partial<BreakConfig>,
): SessionBreakdown {
  const cfg = getStudyStrategyConfig('pomodoro', config)
  const breaks: BreakInterval[] = []
  let minutesElapsed = 0
  let pomodoroCount = 0
  let totalBreakMinutes = 0

  while (minutesElapsed < sessionMinutes) {
    minutesElapsed += cfg.maxStudyBlockMinutes
    pomodoroCount += 1

    if (minutesElapsed < sessionMinutes) {
      const isLongBreak = pomodoroCount % cfg.pomodorosBeforeLongBreak === 0
      const breakDuration = isLongBreak ? cfg.longBreakMinutes : cfg.shortBreakMinutes

      breaks.push({
        afterMinutes: minutesElapsed,
        durationMinutes: breakDuration,
        type: isLongBreak ? 'long' : 'short',
        label: isLongBreak
          ? `Descanso largo (${cfg.longBreakMinutes} min) - Estira, camina, hidratate.`
          : `Descanso corto (${cfg.shortBreakMinutes} min) - Respira profundo.`,
      })

      totalBreakMinutes += breakDuration
      minutesElapsed += breakDuration
    }
  }

  return {
    studyMinutes: sessionMinutes,
    breakMinutes: totalBreakMinutes,
    totalMinutes: sessionMinutes + totalBreakMinutes,
    breaks,
    pomodoroCount,
  }
}

export function calculateBalancedBreaks(
  sessionMinutes: number,
  config?: Partial<BreakConfig>,
): SessionBreakdown {
  const cfg = getStudyStrategyConfig('balanced', config)
  const breaks: BreakInterval[] = []
  let totalBreakMinutes = 0

  if (sessionMinutes <= 30) {
    if (sessionMinutes > 20) {
      breaks.push({
        afterMinutes: sessionMinutes,
        durationMinutes: 3,
        type: 'micro',
        label: 'Micro-descanso (3 min)',
      })
      totalBreakMinutes = 3
    }
  } else if (sessionMinutes <= 60) {
    const midpoint = Math.floor(sessionMinutes / 2)
    breaks.push({
      afterMinutes: midpoint,
      durationMinutes: cfg.shortBreakMinutes,
      type: 'short',
      label: `Descanso (${cfg.shortBreakMinutes} min) - Estira y descansa la vista.`,
    })
    totalBreakMinutes = cfg.shortBreakMinutes
  } else if (sessionMinutes <= 90) {
    let elapsed = 30
    while (elapsed < sessionMinutes) {
      breaks.push({
        afterMinutes: elapsed,
        durationMinutes: 10,
        type: 'short',
        label: 'Descanso (10 min) - Camina un poco.',
      })
      totalBreakMinutes += 10
      elapsed += 40
    }
  } else {
    let elapsed = 45
    let breakCount = 0
    while (elapsed < sessionMinutes) {
      breakCount += 1
      const isLong = breakCount % 2 === 0
      const duration = isLong ? cfg.longBreakMinutes : 10

      breaks.push({
        afterMinutes: elapsed,
        durationMinutes: duration,
        type: isLong ? 'long' : 'short',
        label: isLong
          ? `Descanso largo (${cfg.longBreakMinutes} min) - Toma un snack.`
          : 'Descanso (10 min) - Hidratate.',
      })
      totalBreakMinutes += duration
      elapsed += 45 + duration
    }
  }

  return {
    studyMinutes: sessionMinutes,
    breakMinutes: totalBreakMinutes,
    totalMinutes: sessionMinutes + totalBreakMinutes,
    breaks,
  }
}

export function calculateIntensiveBreaks(
  sessionMinutes: number,
  config?: Partial<BreakConfig>,
): SessionBreakdown {
  const cfg = getStudyStrategyConfig('intensive', config)
  const breaks: BreakInterval[] = []
  let totalBreakMinutes = 0

  if (sessionMinutes <= 60) {
    return {
      studyMinutes: sessionMinutes,
      breakMinutes: 0,
      totalMinutes: sessionMinutes,
      breaks: [],
    }
  }

  let elapsed = 60
  let breakCount = 0
  while (elapsed < sessionMinutes) {
    breakCount += 1
    const isLong = breakCount % 2 === 0
    const duration = isLong ? cfg.longBreakMinutes : cfg.shortBreakMinutes

    breaks.push({
      afterMinutes: elapsed,
      durationMinutes: duration,
      type: isLong ? 'long' : 'micro',
      label: isLong ? 'Descanso obligatorio (10 min)' : 'Micro-descanso (3 min)',
    })

    totalBreakMinutes += duration
    elapsed += 60 + duration
  }

  return {
    studyMinutes: sessionMinutes,
    breakMinutes: totalBreakMinutes,
    totalMinutes: sessionMinutes + totalBreakMinutes,
    breaks,
  }
}

export function calculateStudyBreaks(
  sessionMinutes: number,
  mode: StudyMode,
  config?: Partial<BreakConfig>,
): SessionBreakdown {
  switch (mode) {
    case 'pomodoro':
      return calculatePomodoroBreaks(sessionMinutes, config)
    case 'balanced':
      return calculateBalancedBreaks(sessionMinutes, config)
    case 'intensive':
      return calculateIntensiveBreaks(sessionMinutes, config)
    default:
      return calculateBalancedBreaks(sessionMinutes, config)
  }
}

export function formatBreaksForDisplay(breakdown: SessionBreakdown): string[] {
  if (breakdown.breaks.length === 0) {
    return ['Sin descansos programados para esta sesion']
  }

  return breakdown.breaks.map((brk) => {
    const prefix = brk.type === 'long' ? '*' : brk.type === 'short' ? '-' : '>'
    return `${prefix} A los ${brk.afterMinutes} min: ${brk.label || `Descanso de ${brk.durationMinutes} min`}`
  })
}

export function calculateTotalTimeWithBreaks(
  sessionMinutes: number,
  mode: StudyMode,
  config?: Partial<BreakConfig>,
): number {
  return calculateStudyBreaks(sessionMinutes, mode, config).totalMinutes
}
