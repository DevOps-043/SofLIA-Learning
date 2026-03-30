'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BusinessUser } from '../services/businessUsers.service'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '../../../core/stores/themeStore'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
}

interface UserStats {
  total_courses: number
  completed_courses: number
  in_progress_courses: number
  not_started_courses: number
  average_progress: number
  total_time_spent_minutes: number
  total_time_spent_hours: number
  completed_lessons: number
  total_lessons: number
  certificates_count: number
  notes_count: number
  total_assignments: number
  completed_assignments: number
  lia_conversations_total?: number
  lia_messages_total?: number
  quiz_total?: number
  quiz_passed?: number
  quiz_failed?: number
  quiz_average_score?: number
  lia_activities_completed?: number
  lia_activities_total?: number
  courses_data: Array<{
    course_id: string
    course_title: string
    progress: number
    status: string
    enrolled_at: string
    completed_at: string | null
    has_certificate: boolean
    lia_conversations_count?: number
    lia_messages_count?: number
    lia_avg_duration_minutes?: number
    lia_last_conversation?: string | null
    quiz_total?: number
    quiz_passed?: number
    quiz_failed?: number
    quiz_average_score?: number
    quiz_best_score?: number
    quiz_total_attempts?: number
    lia_activities_completed?: number
    notes_count?: number
    time_spent_minutes?: number
    modules_total?: number
    modules_completed?: number
    lessons_total?: number
    lessons_completed?: number
    lessons_in_progress?: number
    activities_completed?: number
    activities_total?: number
    readings_viewed?: number
    quiz_lessons_completed?: number
  }>
  time_by_course: Array<{
    course_id: string
    course_title: string
    total_minutes: number
    total_hours: number
  }>
  completed_by_month: Array<{
    month: string
    count: number
  }>
  distribution: {
    completed: number
    in_progress: number
    not_started: number
  }
}

// Fallback translations in case i18n fails
const fallbackTranslations: Record<string, string> = {
  'users.stats.time.never': 'Nunca',
  'users.stats.time.invalid': 'Fecha inválida',
  'users.stats.time.moments': 'Hace unos momentos',
  'users.stats.time.minutes': 'Hace {{count}} minuto(s)',
  'users.stats.time.hours': 'Hace {{count}} hora(s)',
  'users.stats.time.days': 'Hace {{count}} día(s)',
  'users.stats.time.weeks': 'Hace {{count}} semana(s)',
  'users.stats.time.months': 'Hace {{count}} mes(es)',
  'users.stats.time.years': 'Hace {{count}} año(s)',
  'users.stats.time.today': 'Hoy',
  'users.stats.time.yesterday': 'Ayer',
  'users.stats.labels.typeRole': 'Tipo de Rol',
  'users.stats.labels.lastConnection': 'Última Conexión',
  'users.stats.labels.joined': 'Se unió',
  'users.stats.cards.courses': 'Cursos',
  'users.stats.cards.completed': 'Completados',
  'users.stats.cards.hours': 'Horas',
  'users.stats.cards.certificates': 'Certificados',
  'users.stats.platformActivity.title': 'Actividad en la Plataforma',
  'users.stats.platformActivity.liaQueries': 'Consultas LIA',
  'users.stats.platformActivity.messages': 'mensajes',
  'users.stats.platformActivity.quizzesPassed': 'Quiz Aprobados',
  'users.stats.platformActivity.average': 'promedio',
  'users.stats.platformActivity.liaActivities': 'Actividades LIA',
  'users.stats.platformActivity.total': 'total',
  'users.stats.generalProgress.title': 'Progreso General',
  'users.stats.generalProgress.subtitle': 'Avance en todos los cursos asignados',
  'users.stats.generalProgress.completed': 'Completados',
  'users.stats.generalProgress.inProgress': 'En Progreso',
  'users.stats.generalProgress.notStarted': 'Sin Iniciar',
  'users.stats.coursesList.empty': 'No hay cursos asignados',
  'users.stats.coursesList.enrolled': 'Inscrito',
  'users.stats.coursesList.certificate': 'Certificado',
  'users.stats.coursesList.completed': 'Completado',
  'users.stats.coursesList.inProgress': 'En progreso',
  'users.stats.coursesList.notStarted': 'Sin iniciar',
  'users.stats.coursesList.progress': 'Progreso del curso',
  'users.stats.coursesList.time': 'Tiempo',
  'users.stats.coursesList.lia': 'LIA',
  'users.stats.coursesList.quiz': 'Quiz',
  'users.stats.coursesList.notes': 'Notas',
  'users.stats.timeline.empty': 'No hay progreso que mostrar',
  'users.stats.timeline.modules': 'módulos',
  'users.stats.timeline.lessons': 'lecciones',
  'users.stats.timeline.quizzes': 'quiz',
  'users.stats.activity.notesCreated': 'Notas Creadas',
  'users.stats.activity.assignments': 'Asignaciones',
  'users.stats.activity.certificates': 'Certificados',
  'users.stats.activity.completionHistory': 'Historial de Completados',
  'users.stats.activity.courses': 'curso(s)',
  'users.stats.activity.summary': 'Resumen de Actividad',
  'users.stats.activity.studyTime': 'Tiempo de estudio',
  'users.stats.activity.lessons': 'Lecciones',
  'users.roles.owner': 'Propietario',
  'users.roles.admin': 'Administrador',
  'users.roles.member': 'Miembro'
}

export function useBusinessUserStatsModalLogic({ user, isOpen, onClose }: BusinessUserStatsModalProps) {
  const { t: originalT } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  // Helper function that provides fallback translations
  const t = (key: string, options?: any): string => {
    const result = originalT(key, options)
    const resultStr = typeof result === 'string' ? result : String(result)
    // If the result equals the key, it means translation was not found
    if (resultStr === key || resultStr.includes('.stats.')) {
      let fallback = fallbackTranslations[key] || key
      // Handle interpolation for count
      if (options?.count !== undefined && fallback.includes('{{count}}')) {
        fallback = fallback.replace('{{count}}', String(options.count))
      }
      return fallback
    }
    return resultStr
  }

  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'progress' | 'activity'>('overview')

  // Aplicar colores personalizados
  const modalBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.95)') : '#FFFFFF'
  const modalBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : 'rgba(226, 232, 240, 0.8)'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'

  useEffect(() => {
    if (isOpen && user) {
      fetchUserStats()
    }
  }, [isOpen, user])

  const fetchUserStats = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/business/users/${user.id}/stats`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas')
      }

      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return t('users.stats.time.never')

    try {
      const date = new Date(dateString)
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return t('users.stats.time.invalid')

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()

      // Si la fecha es en el futuro, mostrar la fecha completa
      if (diffMs < 0) {
        return formatDate(dateString)
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (diffMinutes < 1) return t('users.stats.time.moments')
      if (diffMinutes < 60) return t('users.stats.time.minutes', { count: diffMinutes, plural: diffMinutes > 1 ? 's' : '' })
      if (diffHours < 24) return t('users.stats.time.hours', { count: diffHours, plural: diffHours > 1 ? 's' : '' })
      if (diffDays === 0) return t('users.stats.time.today')
      if (diffDays === 1) return t('users.stats.time.yesterday')
      if (diffDays < 7) return t('users.stats.time.days', { count: diffDays })
      if (diffDays < 30) return t('users.stats.time.weeks', { count: Math.floor(diffDays / 7) })
      if (diffDays < 365) return t('users.stats.time.months', { count: Math.floor(diffDays / 30) })
      return t('users.stats.time.years', { count: Math.floor(diffDays / 365) })
    } catch (error) {
      // Si hay algún error, intentar mostrar la fecha formateada
      return formatDate(dateString)
    }
  }

  const displayName = user
    ? user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : ''
  const initials = user
    ? (user.first_name?.[0] || user.username[0] || 'U').toUpperCase()
    : 'U'

  return {
    t,
    isDark,
    stats,
    loading,
    error,
    activeTab,
    setActiveTab,
    modalBg,
    modalBorder,
    textColor,
    primaryColor,
    accentColor,
    secondaryColor,
    formatMonth,
    formatDate,
    formatRelativeTime,
    displayName,
    initials,
  }
}
