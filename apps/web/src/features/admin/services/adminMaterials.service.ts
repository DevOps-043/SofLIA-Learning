import {
  createMaterial,
  deleteMaterial,
  getLessonMaterials,
  getMaterialById,
  recalculateLessonDuration,
  reorderMaterials,
  updateMaterial,
  updateModuleDurationFromLesson,
  uploadMaterialFile,
} from './admin-materials'
import type {
  AdminMaterial,
  CreateMaterialData,
  UpdateMaterialData,
} from './admin-materials/admin-materials.types'

export type { AdminMaterial, CreateMaterialData, UpdateMaterialData } from './admin-materials/admin-materials.types'

export class AdminMaterialsService {
  static async getLessonMaterials(lessonId: string): Promise<AdminMaterial[]> {
    return getLessonMaterials(lessonId)
  }

  static async getMaterialById(materialId: string): Promise<AdminMaterial | null> {
    return getMaterialById(materialId)
  }

  static async createMaterial(
    lessonId: string,
    materialData: CreateMaterialData,
    userId?: string,
  ): Promise<AdminMaterial> {
    return createMaterial(lessonId, materialData, userId)
  }

  static async updateMaterial(
    materialId: string,
    materialData: UpdateMaterialData,
  ): Promise<AdminMaterial> {
    return updateMaterial(materialId, materialData)
  }

  static async deleteMaterial(materialId: string): Promise<void> {
    return deleteMaterial(materialId)
  }

  static async reorderMaterials(
    lessonId: string,
    materials: Array<{ material_id: string; material_order_index: number }>,
  ): Promise<void> {
    return reorderMaterials(lessonId, materials)
  }

  static async uploadMaterialFile(file: File, materialType: string): Promise<string> {
    return uploadMaterialFile(file, materialType)
  }

  static async updateModuleDurationFromLesson(lessonId: string): Promise<void> {
    return updateModuleDurationFromLesson(lessonId)
  }

  static async recalculateLessonDuration(lessonId: string): Promise<void> {
    return recalculateLessonDuration(lessonId)
  }
}
