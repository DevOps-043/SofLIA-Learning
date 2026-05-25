import { getInstructors } from './workshops-instructors-query.service'
import { getAllWorkshops } from './workshops-list-query.service'
import { getWorkshopsPage } from './workshops-page-query.service'
import { getWorkshopStats } from './workshops-stats-query.service'
import type {
  AdminWorkshop,
  AdminWorkshopListFilters,
  AdminWorkshopListResult,
  WorkshopStats,
} from './workshops-transform.service'

export class AdminWorkshopsQueryService {
  static getWorkshopsPage(
    filters: AdminWorkshopListFilters,
  ): Promise<AdminWorkshopListResult> {
    return getWorkshopsPage(filters)
  }

  static getAllWorkshops(): Promise<AdminWorkshop[]> {
    return getAllWorkshops()
  }

  static getWorkshopStats(): Promise<WorkshopStats> {
    return getWorkshopStats()
  }

  static getInstructors(): Promise<Array<{ id: string, name: string }>> {
    return getInstructors()
  }
}
