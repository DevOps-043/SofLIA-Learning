'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from './useBusinessPanelTheme'
import {
  getBusinessUserStatsDisplayName,
  getBusinessUserStatsInitials,
} from '../services/business-user-stats-display.service'
import type { BusinessUserStatsTranslateOptions } from '../components/business-user-stats-modal/types'
import type { BusinessUser } from '../services/businessUsers.service'
import type {
  BusinessUserStatsApiResponse,
  BusinessUserStatsData,
  BusinessUserStatsTabId,
} from '../types/business-user-stats.types'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  orgSlug?: string
}

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
  'users.stats.platformActivity.liaQueries': 'Consultas SofLIA',
  'users.stats.platformActivity.messages': 'mensajes',
  'users.stats.platformActivity.quizzesPassed': 'Quiz Aprobados',
  'users.stats.platformActivity.average': 'promedio',
  'users.stats.platformActivity.liaActivities': 'Actividades SofLIA',
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
  'users.stats.coursesList.lia': 'SofLIA',
  'users.stats.coursesList.quiz': 'Quiz',
  'users.stats.coursesList.notes': 'Notas',
  'users.modals.stats.coursesList.empty': 'No hay cursos asignados',
  'users.modals.stats.coursesList.enrolled': 'Inscrito',
  'users.modals.stats.coursesList.assignedAt': 'Asignado',
  'users.modals.stats.coursesList.due': 'Fecha limite',
  'users.modals.stats.coursesList.certificate': 'Certificado',
  'users.modals.stats.coursesList.completed': 'Completado',
  'users.modals.stats.coursesList.inProgress': 'En progreso',
  'users.modals.stats.coursesList.notStarted': 'Sin iniciar',
  'users.modals.stats.coursesList.progress': 'Progreso del curso',
  'users.modals.stats.coursesList.courseBreakdown': 'Cursos asignados',
  'users.modals.stats.coursesList.learningProgress': 'Progreso de aprendizaje',
  'users.modals.stats.coursesList.engagementBreakdown': 'Engagement por curso',
  'users.modals.stats.coursesList.lessons': 'Lecciones',
  'users.modals.stats.coursesList.modules': 'Modulos',
  'users.modals.stats.coursesList.studyTime': 'Tiempo de estudio',
  'users.modals.stats.coursesList.activities': 'Actividades',
  'users.modals.stats.coursesList.quizzes': 'Cuestionarios',
  'users.modals.stats.coursesList.sofliaInteractions': 'Interacciones SofLIA',
  'users.modals.stats.coursesList.notes': 'Notas',
  'users.modals.stats.coursesList.notesCreated': 'Notas creadas',
  'users.modals.stats.coursesList.completedOfTotal': '{{completed}} de {{total}} completadas',
  'users.modals.stats.coursesList.avgScore': '{{score}}% promedio',
  'users.modals.stats.coursesList.messagesCount': '{{count}} mensajes',
  'users.modals.stats.coursesList.minutesShort': ' min',
  'users.modals.stats.coursesList.hoursShort': ' h',
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
  'users.roles.member': 'Miembro',
}

export function useBusinessUserStatsModalLogic({
  user,
  isOpen,
  onClose: _onClose,
  orgSlug,
}: BusinessUserStatsModalProps) {
  const { t: originalT } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const [stats, setStats] = useState<BusinessUserStatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<BusinessUserStatsTabId>('analytics')

  const t = (
    key: string,
    options?: BusinessUserStatsTranslateOptions,
  ): string => {
    const translationOptions = typeof options === 'string'
      ? { defaultValue: options }
      : options
    const result = originalT(key, translationOptions)
    const resultString = typeof result === 'string' ? result : String(result)

    if (resultString === key || resultString.includes('.stats.')) {
      let fallback = fallbackTranslations[key] || (typeof options === 'string' ? options : key)
      if (typeof options !== 'string' && options) {
        Object.entries(options).forEach(([optionKey, value]) => {
          fallback = fallback.replaceAll(`{{${optionKey}}}`, String(value))
        })
      }
      return fallback
    }

    return resultString
  }

  const modalBg = theme.panelBg
  const modalBorder = theme.borderColor
  const textColor = theme.textColor
  const primaryColor = theme.primaryColor
  const accentColor = theme.accentColor
  const secondaryColor = theme.secondaryColor

  useEffect(() => {
    if (!isOpen || !user) return

    const fetchUserStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const statsUrl = orgSlug
          ? `/api/${orgSlug}/business/users/${user.id}/stats`
          : `/api/business/users/${user.id}/stats`
        const response = await fetch(statsUrl, {
          credentials: 'include',
        })
        const data = (await response.json()) as
          | ({ success?: false; error?: string } & Record<string, unknown>)
          | BusinessUserStatsApiResponse

        if (!response.ok) {
          throw new Error(
            ('error' in data ? data.error : undefined) || 'Error al cargar estadísticas',
          )
        }

        if (data.success && data.stats) {
          setStats(data.stats)
        }
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Error al cargar estadísticas',
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchUserStats()
  }, [isOpen, user, orgSlug])

  const displayName = getBusinessUserStatsDisplayName(user)
  const initials = getBusinessUserStatsInitials(user)

  return {
    t,
    isDark: theme.isDark,
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
    formatRelativeTime: (dateString: string | null | undefined) =>
      formatRelativeTime(dateString, t, formatDate),
    displayName,
    initials,
  }
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric',
  })
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A'

  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatRelativeTime(
  dateString: string | null | undefined,
  t: (key: string, options?: BusinessUserStatsTranslateOptions) => string,
  formatDateValue: (dateString: string | null | undefined) => string,
) {
  if (!dateString) return t('users.stats.time.never')

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return t('users.stats.time.invalid')

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return formatDateValue(dateString)

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return t('users.stats.time.moments')
  if (diffMinutes < 60) return t('users.stats.time.minutes', { count: diffMinutes })
  if (diffHours < 24) return t('users.stats.time.hours', { count: diffHours })
  if (diffDays === 0) return t('users.stats.time.today')
  if (diffDays === 1) return t('users.stats.time.yesterday')
  if (diffDays < 7) return t('users.stats.time.days', { count: diffDays })
  if (diffDays < 30) return t('users.stats.time.weeks', { count: Math.floor(diffDays / 7) })
  if (diffDays < 365) return t('users.stats.time.months', { count: Math.floor(diffDays / 30) })
  return t('users.stats.time.years', { count: Math.floor(diffDays / 365) })
}
