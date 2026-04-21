import type { ProactiveAnalysis } from './types'

export function buildProactiveAnalysisSection(
  proactiveAnalysis: ProactiveAnalysis,
): string {
  const lines = ['## ANALISIS PROACTIVO DE TU PLAN']

  if (proactiveAnalysis.conflicts.length > 0) {
    lines.push(
      `### CONFLICTOS DETECTADOS\nSe detectaron ${proactiveAnalysis.conflicts.length} conflicto(s) entre sesiones de estudio y otros eventos:`,
    )
    for (const conflict of proactiveAnalysis.conflicts) {
      lines.push(
        `- ${conflict.sessionTitle} programada para ${conflict.sessionDate} de ${conflict.sessionTime}, conflicta con "${conflict.conflictingEvent}" (${conflict.conflictTime})`,
      )
      lines.push(
        `  - Alternativas sugeridas: ${conflict.suggestedAlternatives.join(' | ') || 'No hay alternativas disponibles'}`,
      )
    }
    lines.push(
      'ACCION REQUERIDA: Debes informar al usuario sobre estos conflictos y ofrecer reprogramar las sesiones.',
    )
  }

  if (proactiveAnalysis.overloadedDays.length > 0) {
    lines.push('### DIAS SOBRECARGADOS')
    for (const day of proactiveAnalysis.overloadedDays.slice(0, 3)) {
      lines.push(`- ${day.date}: ${day.totalHours}h de actividad - ${day.suggestion}`)
    }
  }

  if (proactiveAnalysis.burnoutRisk) {
    lines.push('### ALERTA DE SOBRECARGA')
    lines.push(`- Nivel: ${proactiveAnalysis.burnoutRisk.level.toUpperCase()}`)
    lines.push(`- ${proactiveAnalysis.burnoutRisk.suggestion}`)
  }

  if (proactiveAnalysis.missedSessions.length > 0) {
    lines.push('### SESIONES PERDIDAS QUE REQUIEREN RECUPERACION')
    for (const missed of proactiveAnalysis.missedSessions) {
      lines.push(`- ${missed.sessionTitle} (original: ${missed.originalTime})`)
      lines.push(
        `  - Horarios sugeridos para recuperar: ${missed.suggestedRecoverySlots.join(' | ') || 'Buscar horario libre'}`,
      )
    }
  }

  if (proactiveAnalysis.overdueSessions.length > 0) {
    lines.push('### SESIONES NO REALIZADAS')
    for (const overdue of proactiveAnalysis.overdueSessions) {
      const hoursText =
        overdue.hoursOverdue >= 24
          ? `hace ${Math.floor(overdue.hoursOverdue / 24)} dia(s)`
          : `hace ${overdue.hoursOverdue}h`
      lines.push(`- ${overdue.sessionTitle} (programada: ${overdue.scheduledTime}, ${hoursText})`)
      lines.push(
        `  - Horarios sugeridos para recuperar: ${overdue.suggestedRecoverySlots.join(' | ') || 'Buscar horario libre'}`,
      )
    }
  }

  appendProgressSections(lines, proactiveAnalysis)
  appendCompletionSections(lines, proactiveAnalysis)
  appendLiaInstructions(lines)

  return lines.join('\n')
}

function appendProgressSections(lines: string[], proactiveAnalysis: ProactiveAnalysis): void {
  lines.push('### PROGRESO SEMANAL')
  lines.push(`- Planificado: ${Math.round(proactiveAnalysis.weeklyProgress.plannedMinutes / 60)}h`)
  lines.push(`- Completado: ${Math.round(proactiveAnalysis.weeklyProgress.completedMinutes / 60)}h`)
  lines.push(`- Estado: ${proactiveAnalysis.weeklyProgress.onTrack ? 'En camino' : 'Atrasado'}`)
  if (proactiveAnalysis.weeklyProgress.suggestion) {
    lines.push(`- ${proactiveAnalysis.weeklyProgress.suggestion}`)
  }

  if (proactiveAnalysis.consistencyAlert) {
    lines.push('### ALERTA DE CONSISTENCIA')
    lines.push(`- Dias sin estudiar: ${proactiveAnalysis.consistencyAlert.daysWithoutStudy}`)
    lines.push(`- Ultima sesion: ${proactiveAnalysis.consistencyAlert.lastStudyDate}`)
    lines.push(`- ${proactiveAnalysis.consistencyAlert.suggestion}`)
  }

  if (proactiveAnalysis.freeSlots.length > 0) {
    lines.push('### VENTANAS LIBRES PARA MICRO-SESIONES')
    for (const slot of proactiveAnalysis.freeSlots.slice(0, 5)) {
      lines.push(
        `- ${slot.date} ${slot.startTime} - ${slot.endTime} (${slot.duration} min) - ${slot.suggestion}`,
      )
    }
  }
}

function appendCompletionSections(lines: string[], proactiveAnalysis: ProactiveAnalysis): void {
  if (proactiveAnalysis.effectivelyCompletedSessions.length > 0) {
    lines.push('## SESIONES EFECTIVAMENTE COMPLETADAS (lecciones al 100%)')
    for (const completed of proactiveAnalysis.effectivelyCompletedSessions) {
      lines.push(
        `- ${completed.sessionTitle} [ID: ${completed.sessionId}] - Programada hasta: ${completed.scheduledEndTime}, Vinculada al calendario: ${completed.calendarEventLinked ? 'Si' : 'No'}${completed.completedEarly ? ' - Completada antes del horario' : ''}`,
      )
      lines.push(
        '  -> Ofrece al usuario eliminar el evento del calendario para liberar ese bloque (usa delete_session con confirmacion).',
      )
    }
  }

  if (proactiveAnalysis.partialSessions.length > 0) {
    lines.push('## SESIONES EN PROGRESO (iniciadas pero sin completar)')
    for (const partial of proactiveAnalysis.partialSessions) {
      lines.push(
        `- ${partial.sessionTitle} [ID: ${partial.sessionId}] - Progreso: ${partial.progressPct}% - Tiempo restante estimado: ${partial.remainingMinutes} min`,
      )
      lines.push(
        `  -> Slots sugeridos para completarla: ${partial.suggestedCompletionSlots.join(' | ') || 'Buscar hueco libre'}`,
      )
    }
  }
}

function appendLiaInstructions(lines: string[]): void {
  lines.push(
    `---
INSTRUCCIONES PARA LIA:
1. Si hay conflictos, mencionarlos primero y ofrecer soluciones.
2. Si hay dias sobrecargados o riesgo de burnout, sugerir reducir la carga.
3. Si hay sesiones perdidas o no realizadas, ofrecer ayuda para recuperarlas.
4. Si el progreso semanal esta atrasado, ofrecer rebalancear el plan.
5. Si hay huecos libres, sugerir micro-sesiones de repaso.
6. Ser proactiva, empatica y no juzgar al usuario.`,
  )
}
