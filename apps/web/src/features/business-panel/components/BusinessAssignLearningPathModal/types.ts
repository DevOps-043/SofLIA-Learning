import type { ComponentType } from 'react'
import type { TFunction } from 'i18next'
import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessLearningPath, BusinessLearningPathAssignment, BusinessLearningPathHierarchyNode } from '../../services/businessLearningPaths.service'

export type AssignmentMode = 'users' | 'all' | 'node'
export type BusinessPanelTheme = ReturnType<typeof useBusinessPanelTheme>
export type BusinessT = TFunction<'business'>
export type BusinessTranslate = BusinessT

export interface BusinessAssignmentComponentProps {
  t: BusinessT
  theme: BusinessPanelTheme
}

export interface BusinessAssignLearningPathModalProps {
  isOpen: boolean
  onClose: () => void
  orgSlug: string
  learningPath: BusinessLearningPath | null
  users: BusinessUser[]
  isLoadingUsers: boolean
  existingAssignments: BusinessLearningPathAssignment[]
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
  onAssigned: () => Promise<void>
}

export interface AssignmentModeItem {
  mode: AssignmentMode
  icon: ComponentType<{ className?: string }>
  label: string
}
