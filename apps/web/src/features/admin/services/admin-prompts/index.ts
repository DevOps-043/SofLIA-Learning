export * from './admin-prompts-transform.service'
export * from './admin-prompts-query.service'
export * from './admin-prompts-mutation.service'

import {
  getPrompts,
  getCategories,
  getPromptStats,
} from './admin-prompts-query.service'
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
  togglePromptStatus,
  togglePromptFeatured,
} from './admin-prompts-mutation.service'
import type { AdminPrompt } from './admin-prompts-transform.service'

/**
 * Namespace class kept for backward compatibility.
 * Callers that import `AdminPromptsService` continue to work unchanged.
 */
export class AdminPromptsService {
  static getPrompts = getPrompts
  static getCategories = getCategories
  static getPromptStats = getPromptStats
  static createPrompt = (promptData: Partial<AdminPrompt>, adminUserId: string) =>
    createPrompt(promptData, adminUserId)
  static updatePrompt = (promptId: string, promptData: Partial<AdminPrompt>) =>
    updatePrompt(promptId, promptData)
  static deletePrompt = (promptId: string) => deletePrompt(promptId)
  static togglePromptStatus = (promptId: string, isActive: boolean) =>
    togglePromptStatus(promptId, isActive)
  static togglePromptFeatured = (promptId: string, isFeatured: boolean) =>
    togglePromptFeatured(promptId, isFeatured)
}
