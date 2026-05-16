import { BookOpen, Image as ImageIcon, Tag } from 'lucide-react'
import type { AddWorkshopTabItem } from './types'

export const ADD_WORKSHOP_TABS: AddWorkshopTabItem[] = [
  { id: 'basic', labelKey: 'workshops.addModal.tabs.basic', icon: BookOpen },
  { id: 'details', labelKey: 'workshops.addModal.tabs.details', icon: Tag },
  { id: 'media', labelKey: 'workshops.addModal.tabs.media', icon: ImageIcon },
]

export const ADD_WORKSHOP_CATEGORY_OPTIONS = ['ia', 'tecnologia', 'negocios', 'diseno', 'marketing']
export const ADD_WORKSHOP_LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced']
