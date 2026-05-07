import { 
  Bell, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Shield,
  Key,
  User,
  LogIn,
  Mail,
  Lock,
  Users,
  BookOpen,
  Newspaper,
  Video,
  Sparkles,
  MessageSquare,
  UserPlus,
  GraduationCap,
  Clock,
  Calendar,
  LayoutGrid
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

/**
 * Categorías de notificaciones
 */
export type NotificationCategory = 
  | 'system'
  | 'community'
  | 'course'
  | 'news'
  | 'reel'
  | 'prompt'
  | 'critical'
  | 'org'
  | 'planner'

/**
 * Configuración de categoría de notificación
 */
export interface NotificationCategoryConfig {
  category: NotificationCategory
  color: string
  bgColor: string
  borderColor: string
  icon: LucideIcon
  priority: 'critical' | 'high' | 'medium' | 'low'
}

/**
 * Mapeo de tipos de notificación a categorías
 */
export const NOTIFICATION_TYPE_CATEGORY_MAP: Record<string, NotificationCategory> = {
  // Sistema
  'system_password_changed': 'system',
  'system_profile_updated': 'system',
  'system_login_success': 'system',
  'system_login_failed': 'system',
  'system_email_verified': 'system',
  'system_security_alert': 'critical',
  'questionnaire_required': 'critical',
  
  // Comunidad
  'community_post_created': 'community',
  'community_post_comment': 'community',
  'community_post_reaction': 'community',
  'community_member_joined': 'community',
  
  // Cursos
  'course_published': 'course',
  'course_enrolled': 'course',
  'course_completed': 'course',
  'course_lesson_completed': 'course',
  'course_question_answered': 'course',
  
  // Noticias
  'news_published': 'news',
  'news_featured': 'news',
  
  // Reels
  'reel_created': 'reel',
  'reel_liked': 'reel',
  'reel_comment': 'reel',
  
  // Prompts
  'prompt_created': 'prompt',
  'prompt_favorited': 'prompt',

  // Organizaciones
  'org_invitation_received': 'org',
  'org_role_updated': 'org',
  'org_team_assigned': 'org',

  // Learning Paths (B2B)
  'learning_path_assigned': 'course',
  'course_deadline_approaching': 'critical',
  'mandatory_course_reminder': 'critical',

  // Jerarquía
  'hierarchy_chat_message': 'community',

  // Study Planner
  'planner_rebalance_suggested': 'planner',
  'study_session_overdue': 'critical',
}

/**
 * Configuración de categorías
 */
export const NOTIFICATION_CATEGORIES: Record<NotificationCategory, NotificationCategoryConfig> = {
  system: {
    category: 'system',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500',
    icon: Shield,
    priority: 'medium'
  },
  community: {
    category: 'community',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-l-green-500',
    icon: Users,
    priority: 'medium'
  },
  course: {
    category: 'course',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-l-orange-500',
    icon: BookOpen,
    priority: 'high'
  },
  news: {
    category: 'news',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-l-purple-500',
    icon: Newspaper,
    priority: 'medium'
  },
  reel: {
    category: 'reel',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-l-pink-500',
    icon: Video,
    priority: 'low'
  },
  prompt: {
    category: 'prompt',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-l-cyan-500',
    icon: Sparkles,
    priority: 'medium'
  },
  critical: {
    category: 'critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-l-red-500',
    icon: AlertCircle,
    priority: 'critical'
  },
  org: {
    category: 'org',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-l-indigo-500',
    icon: LayoutGrid,
    priority: 'high'
  },
  planner: {
    category: 'planner',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-l-amber-500',
    icon: Calendar,
    priority: 'medium'
  }
}

/**
 * Mapeo específico de tipos de notificación a iconos
 */
export const NOTIFICATION_TYPE_ICONS: Record<string, LucideIcon> = {
  // Sistema
  'system_password_changed': Key,
  'system_profile_updated': User,
  'system_login_success': LogIn,
  'system_login_failed': AlertTriangle,
  'system_email_verified': Mail,
  'system_security_alert': Shield,
  'questionnaire_required': AlertCircle,
  
  // Comunidad
  'community_post_created': MessageSquare,
  'community_post_comment': MessageSquare,
  'community_post_reaction': Bell,
  'community_member_joined': UserPlus,
  
  // Cursos
  'course_published': BookOpen,
  'course_enrolled': GraduationCap,
  'course_completed': CheckCircle2,
  'course_lesson_completed': CheckCircle2,
  'course_question_answered': MessageSquare,
  
  // Noticias
  'news_published': Newspaper,
  'news_featured': Newspaper,
  
  // Reels
  'reel_created': Video,
  'reel_liked': Bell,
  'reel_comment': MessageSquare,
  
  // Prompts
  'prompt_created': Sparkles,
  'prompt_favorited': Sparkles,

  // Organizaciones
  'org_invitation_received': UserPlus,
  'org_role_updated': Shield,
  'org_team_assigned': Users,

  // Learning Paths
  'learning_path_assigned': GraduationCap,
  'course_deadline_approaching': AlertTriangle,
  'mandatory_course_reminder': AlertCircle,

  // Jerarquía
  'hierarchy_chat_message': MessageSquare,

  // Study Planner
  'planner_rebalance_suggested': Sparkles,
  'study_session_overdue': Clock,
}

/**
 * Obtiene la configuración de categoría para un tipo de notificación
 */
export function getNotificationCategoryConfig(notificationType: string): NotificationCategoryConfig {
  const category = NOTIFICATION_TYPE_CATEGORY_MAP[notificationType] || 'system'
  return NOTIFICATION_CATEGORIES[category]
}

/**
 * Obtiene el icono para un tipo de notificación
 */
export function getNotificationIcon(notificationType: string): LucideIcon {
  return NOTIFICATION_TYPE_ICONS[notificationType] || NOTIFICATION_CATEGORIES.system.icon
}

/**
 * Obtiene el color de borde para un tipo de notificación
 */
export function getNotificationBorderColor(notificationType: string): string {
  const config = getNotificationCategoryConfig(notificationType)
  return config.borderColor
}

/**
 * Obtiene el color de fondo para un tipo de notificación
 */
export function getNotificationBgColor(notificationType: string): string {
  const config = getNotificationCategoryConfig(notificationType)
  return config.bgColor
}

/**
 * Obtiene el color de texto para un tipo de notificación
 */
export function getNotificationTextColor(notificationType: string): string {
  const config = getNotificationCategoryConfig(notificationType)
  return config.color
}

/**
 * Obtiene la prioridad para un tipo de notificación
 */
export function getNotificationPriority(notificationType: string): 'critical' | 'high' | 'medium' | 'low' {
  const config = getNotificationCategoryConfig(notificationType)
  return config.priority
}

