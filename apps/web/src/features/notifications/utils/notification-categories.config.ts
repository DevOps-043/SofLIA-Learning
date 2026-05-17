import {
  AlertCircle,
  BookOpen,
  Calendar,
  LayoutGrid,
  Newspaper,
  Shield,
  Sparkles,
  Users,
  Video,
} from 'lucide-react'
import type {
  NotificationCategory,
  NotificationCategoryConfig,
} from './notification-categories.types'

export const NOTIFICATION_CATEGORIES: Record<
  NotificationCategory,
  NotificationCategoryConfig
> = {
  system: {
    category: 'system',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500',
    icon: Shield,
    priority: 'medium',
  },
  community: {
    category: 'community',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-l-green-500',
    icon: Users,
    priority: 'medium',
  },
  course: {
    category: 'course',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-l-orange-500',
    icon: BookOpen,
    priority: 'high',
  },
  news: {
    category: 'news',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-l-purple-500',
    icon: Newspaper,
    priority: 'medium',
  },
  reel: {
    category: 'reel',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-l-pink-500',
    icon: Video,
    priority: 'low',
  },
  prompt: {
    category: 'prompt',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-l-cyan-500',
    icon: Sparkles,
    priority: 'medium',
  },
  critical: {
    category: 'critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-l-red-500',
    icon: AlertCircle,
    priority: 'critical',
  },
  org: {
    category: 'org',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-l-indigo-500',
    icon: LayoutGrid,
    priority: 'high',
  },
  planner: {
    category: 'planner',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-l-amber-500',
    icon: Calendar,
    priority: 'medium',
  },
}
