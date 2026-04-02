import type { StudyPlannerSessionsDateRange } from './study-planner-sessions.types'
import { StudyPlannerSessionsRequestError } from './study-planner-sessions.types'

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime())
}

export function parseStudyPlannerSessionsDateRange(
  requestUrl: string,
): StudyPlannerSessionsDateRange {
  const { searchParams } = new URL(requestUrl)
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')

  if (!startDateParam || !endDateParam) {
    throw new StudyPlannerSessionsRequestError(
      'Faltan parametros startDate y endDate',
    )
  }

  const startDate = new Date(startDateParam)
  const endDate = new Date(endDateParam)

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new StudyPlannerSessionsRequestError(
      'startDate y endDate deben ser fechas validas',
    )
  }

  if (endDate < startDate) {
    throw new StudyPlannerSessionsRequestError(
      'endDate debe ser posterior o igual a startDate',
    )
  }

  return {
    startDate,
    endDate,
  }
}
