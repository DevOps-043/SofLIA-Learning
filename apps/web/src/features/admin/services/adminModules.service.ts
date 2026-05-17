import {
  calculateModuleDuration,
  createModule,
  deleteModule,
  getCourseModules,
  getModuleById,
  reorderModules,
  toggleModulePublished,
  updateModule,
} from './admin-modules'
import type {
  AdminModule,
  CreateModuleData,
  UpdateModuleData,
} from './admin-modules/admin-modules.types'

export type { AdminLesson, AdminModule, CreateModuleData, UpdateModuleData } from './admin-modules/admin-modules.types'

export class AdminModulesService {
  static async getCourseModules(courseId: string): Promise<AdminModule[]> {
    return getCourseModules(courseId)
  }

  static async getModuleById(moduleId: string): Promise<AdminModule | null> {
    return getModuleById(moduleId)
  }

  static async createModule(
    courseId: string,
    moduleData: CreateModuleData,
    userId?: string,
  ): Promise<AdminModule> {
    return createModule(courseId, moduleData, userId)
  }

  static async updateModule(
    moduleId: string,
    moduleData: UpdateModuleData,
  ): Promise<AdminModule> {
    return updateModule(moduleId, moduleData)
  }

  static async deleteModule(moduleId: string): Promise<void> {
    return deleteModule(moduleId)
  }

  static async reorderModules(
    courseId: string,
    modules: Array<{ module_id: string; module_order_index: number }>,
  ): Promise<void> {
    return reorderModules(courseId, modules)
  }

  static async toggleModulePublished(moduleId: string): Promise<AdminModule> {
    return toggleModulePublished(moduleId)
  }

  static async calculateModuleDuration(moduleId: string): Promise<number> {
    return calculateModuleDuration(moduleId)
  }
}
