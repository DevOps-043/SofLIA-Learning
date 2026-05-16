import type { LucideIcon } from 'lucide-react'

export type AddWorkshopTab = 'basic' | 'details' | 'media'

export interface AddWorkshopTabItem {
  id: AddWorkshopTab
  labelKey: string
  icon: LucideIcon
}
