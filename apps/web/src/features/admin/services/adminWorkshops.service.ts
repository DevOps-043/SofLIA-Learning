// Barrel re-export — all logic lives in sub-files
export type { AdminWorkshop, WorkshopStats } from './admin-workshops/workshops-transform.service'
export { AdminWorkshopsQueryService } from './admin-workshops/workshops-query.service'
export { AdminWorkshopsMutationService } from './admin-workshops/workshops-mutation.service'

import { AdminWorkshopsQueryService } from './admin-workshops/workshops-query.service'
import { AdminWorkshopsMutationService } from './admin-workshops/workshops-mutation.service'
import type { AdminWorkshop, WorkshopStats } from './admin-workshops/workshops-transform.service'

/**
 * Unified facade — preserves the original class name so all existing
 * imports continue to work without changes.
 */
export class AdminWorkshopsService {
  static getAllWorkshops(): Promise<AdminWorkshop[]> {
    return AdminWorkshopsQueryService.getAllWorkshops()
  }

  static getWorkshopStats(): Promise<WorkshopStats> {
    return AdminWorkshopsQueryService.getWorkshopStats()
  }

  static getInstructors(): Promise<Array<{ id: string; name: string }>> {
    return AdminWorkshopsQueryService.getInstructors()
  }

  static createWorkshop(
    workshopData: Partial<AdminWorkshop>,
    adminUserId: string,
    requestInfo?: { ip?: string; userAgent?: string },
  ): Promise<AdminWorkshop> {
    return AdminWorkshopsMutationService.createWorkshop(workshopData, adminUserId, requestInfo)
  }

  static updateWorkshop(
    workshopId: string,
    workshopData: Partial<AdminWorkshop>,
    adminUserId: string,
    requestInfo?: { ip?: string; userAgent?: string },
  ): Promise<AdminWorkshop> {
    return AdminWorkshopsMutationService.updateWorkshop(workshopId, workshopData, adminUserId, requestInfo)
  }

  static deleteWorkshop(
    workshopId: string,
    adminUserId: string,
    requestInfo?: { ip?: string; userAgent?: string },
  ): Promise<void> {
    return AdminWorkshopsMutationService.deleteWorkshop(workshopId, adminUserId, requestInfo)
  }
}
