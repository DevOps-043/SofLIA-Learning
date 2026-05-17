import type { CalendarDate } from '../calendar/types'
import type {
  CalendarEvent,
  StudyPlannerCalendarEventPosition,
} from './study-planner-calendar.types'
import { getEventPosition } from './study-planner-calendar-position.utils'

type EventLayout = CalendarEvent & { position: StudyPlannerCalendarEventPosition }

export function buildTimedLayouts(
  timedEvents: CalendarEvent[],
  date: CalendarDate,
): EventLayout[] {
  return buildEventClusters(timedEvents).flatMap((cluster) =>
    buildTimedLayoutsForCluster(cluster, date),
  )
}

function buildEventClusters(timedEvents: CalendarEvent[]): CalendarEvent[][] {
  const clusters: CalendarEvent[][] = []
  let currentCluster: CalendarEvent[] = []
  let clusterEnd = 0

  for (const event of timedEvents) {
    const start = new Date(event.start).getTime()
    const end = new Date(event.end).getTime()

    if (start < clusterEnd) {
      currentCluster.push(event)
      clusterEnd = Math.max(clusterEnd, end)
    } else {
      if (currentCluster.length > 0) clusters.push(currentCluster)
      currentCluster = [event]
      clusterEnd = end
    }
  }

  if (currentCluster.length > 0) clusters.push(currentCluster)
  return clusters
}

function assignColumns(cluster: CalendarEvent[]) {
  const columns: CalendarEvent[][] = []
  const eventToColumn = new Map<string, number>()

  for (const event of cluster) {
    const columnIndex = columns.findIndex((column) => {
      const lastEvent = column[column.length - 1]
      return new Date(event.start).getTime() >= new Date(lastEvent.end).getTime()
    })

    if (columnIndex >= 0) {
      columns[columnIndex].push(event)
      eventToColumn.set(event.id, columnIndex)
    } else {
      columns.push([event])
      eventToColumn.set(event.id, columns.length - 1)
    }
  }

  return { columns, eventToColumn }
}

function buildTimedLayoutsForCluster(
  cluster: CalendarEvent[],
  date: CalendarDate,
): EventLayout[] {
  const { columns, eventToColumn } = assignColumns(cluster)
  const offsetPerColumn = 15

  return cluster.map((event) => {
    const column = eventToColumn.get(event.id) ?? 0
    const position = getEventPosition(event, date)
    const left = columns.length > 1
      ? Math.min(column * offsetPerColumn, (column / columns.length) * 80)
      : 0

    return {
      ...event,
      position: {
        ...position!,
        left,
        width: 100 - left,
        zIndex: column + 1,
      },
    }
  })
}
