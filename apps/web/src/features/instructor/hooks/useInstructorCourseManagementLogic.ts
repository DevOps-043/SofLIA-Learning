'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useInstructorModules } from '@/features/instructor/hooks/useInstructorModules'
import { useInstructorLessons } from '@/features/instructor/hooks/useInstructorLessons'
import { useInstructorMaterials } from '@/features/instructor/hooks/useInstructorMaterials'
import { useInstructorActivities } from '@/features/instructor/hooks/useInstructorActivities'
import { AdminModule } from '@/features/admin/services/adminModules.service'
import { AdminLesson } from '@/features/admin/services/adminLessons.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { CourseSkill } from '@/features/courses/components/CourseSkillsSelector'

interface InstructorCourseManagementPageProps {
  courseId: string
}

export function useInstructorCourseManagementLogic({ courseId }: InstructorCourseManagementPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'modules' | 'config' | 'certificates' | 'preview' | 'stats'>('modules')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<AdminModule | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [deletingModule, setDeletingModule] = useState<AdminModule | null>(null)
  const [showDeleteModuleModal, setShowDeleteModuleModal] = useState(false)
  const [deletingLesson, setDeletingLesson] = useState<AdminLesson | null>(null)
  const [showDeleteLessonModal, setShowDeleteLessonModal] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { modules, loading: modulesLoading, fetchModules, createModule, updateModule, deleteModule } = useInstructorModules()
  const { lessons, loading: lessonsLoading, fetchLessons, createLesson, updateLesson, deleteLesson } = useInstructorLessons(courseId)
  const { materials, fetchMaterials, createMaterial } = useInstructorMaterials()
  const { activities, fetchActivities, createActivity, updateActivity } = useInstructorActivities()
  const { user } = useAuth()

  const [workshopPreview, setWorkshopPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any>(null)
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState<boolean>(false)
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] = useState<string>('default')
  const [instructorSignatureUrl, setInstructorSignatureUrl] = useState<string | null>(null)
  const [instructorSignatureName, setInstructorSignatureName] = useState<string | null>(null)
  const [courseSkills, setCourseSkills] = useState<CourseSkill[]>([])
  const [savingSkills, setSavingSkills] = useState(false)
  const [configData, setConfigData] = useState({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 60,
    price: 0,
    thumbnail_url: '',
    slug: '',
  })

  useEffect(() => {
    fetchModules(courseId)
    // cargar datos para vista previa
    const loadPreview = async () => {
      try {
        setPreviewLoading(true)
        const res = await fetch(`/api/instructor/workshops/${courseId}`)
        const data = await res.json()
        if (res.ok && data?.workshop) setWorkshopPreview(data.workshop)
      } finally {
        setPreviewLoading(false)
      }
    }
    loadPreview()

    // Cargar firma del instructor desde la base de datos
    const loadInstructorSignature = async () => {
      if (!user?.id) return

      try {
        const res = await fetch(`/api/auth/me`)
        const data = await res.json()
        if (res.ok && data?.user) {
          // Los campos signature_url y signature_name se obtendrán cuando se agreguen a la BD
          // Por ahora, se mantendrán en el estado local
          if (data.user.signature_url) {
            setInstructorSignatureUrl(data.user.signature_url)
          }
          if (data.user.signature_name) {
            setInstructorSignatureName(data.user.signature_name)
          }
        }
      } catch (error) {
      }
    }
    loadInstructorSignature()
  }, [courseId, user?.id])

  useEffect(() => {
    if (workshopPreview) {
      setConfigData({
        title: workshopPreview.title || '',
        description: workshopPreview.description || '',
        category: workshopPreview.category || 'ia',
        level: workshopPreview.level || 'beginner',
        duration_total_minutes: workshopPreview.duration_total_minutes || 60,
        price: workshopPreview.price || 0,
        thumbnail_url: workshopPreview.thumbnail_url || '',
        slug: workshopPreview.slug || '',
      })
    }
  }, [workshopPreview])

  // Cargar estadísticas de usuarios cuando se abre la pestaña
  useEffect(() => {
    if (activeTab === 'stats') {
      ; (async () => {
        try {
          setStatsLoading(true)
          const res = await fetch(`/api/instructor/workshops/${courseId}/stats`)
          const data = await res.json()
          if (res.ok && data?.stats) {
            setUserStats(data.stats)
            setEnrolledUsers(data.enrolled_users || [])
            setChartData(data.charts || null)
          }
        } catch (e) {
        } finally {
          setStatsLoading(false)
        }
      })()
    }
  }, [activeTab, courseId])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const showFeedbackMessage = (type: 'success' | 'error', message: string) => {
    setFeedbackMessage({ type, message })
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = setTimeout(() => setFeedbackMessage(null), 4000)
  }

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setConfigData(prev => ({ ...prev, [name]: name === 'price' || name === 'duration_total_minutes' ? Number(value) : value }))
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingConfig(true)
      const res = await fetch(`/api/instructor/workshops/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al guardar la configuración')
      }
      // Guardar skills
      await handleSaveSkills()
      // refrescar preview
      const refreshed = await fetch(`/api/instructor/workshops/${courseId}`).then(r => r.json())
      if (refreshed?.workshop) setWorkshopPreview(refreshed.workshop)
      showFeedbackMessage('success', 'Configuración guardada correctamente')
    } catch (err) {
      showFeedbackMessage('error', err instanceof Error ? err.message : 'Error al guardar la configuración')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveSkills = async () => {
    try {
      setSavingSkills(true)
      const res = await fetch(`/api/courses/${courseId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: courseSkills }),
        credentials: 'include'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al guardar skills')
      }
    } catch (err) {
      console.error('Error saving skills:', err)
      throw err
    } finally {
      setSavingSkills(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else {
        next.add(moduleId)
        fetchLessons(moduleId, courseId)
      }
      return next
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) next.delete(lessonId)
      else {
        next.add(lessonId)
        // Obtener el moduleId de la lección
        const lesson = lessons.find((l: AdminLesson) => l.lesson_id === lessonId)
        if (lesson && lesson.module_id) {
          fetchMaterials(lessonId, courseId, lesson.module_id)
          fetchActivities(lessonId, courseId, lesson.module_id)
        }
      }
      return next
    })
  }

  return {
    router,
    activeTab,
    setActiveTab,
    expandedModules,
    expandedLessons,
    showModuleModal,
    setShowModuleModal,
    showLessonModal,
    setShowLessonModal,
    showMaterialModal,
    setShowMaterialModal,
    showActivityModal,
    setShowActivityModal,
    selectedModule,
    setSelectedModule,
    selectedLesson,
    setSelectedLesson,
    editingModuleId,
    setEditingModuleId,
    editingLessonId,
    setEditingLessonId,
    editingActivityId,
    setEditingActivityId,
    deletingModule,
    setDeletingModule,
    showDeleteModuleModal,
    setShowDeleteModuleModal,
    deletingLesson,
    setDeletingLesson,
    showDeleteLessonModal,
    setShowDeleteLessonModal,
    feedbackMessage,
    modules,
    modulesLoading,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    lessons,
    lessonsLoading,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    materials,
    fetchMaterials,
    createMaterial,
    activities,
    fetchActivities,
    createActivity,
    updateActivity,
    user,
    workshopPreview,
    setWorkshopPreview,
    previewLoading,
    userStats,
    enrolledUsers,
    statsLoading,
    chartData,
    savingConfig,
    showTemplatePreview,
    setShowTemplatePreview,
    selectedCertificateTemplate,
    setSelectedCertificateTemplate,
    instructorSignatureUrl,
    instructorSignatureName,
    courseSkills,
    setCourseSkills,
    savingSkills,
    configData,
    setConfigData,
    showFeedbackMessage,
    handleConfigChange,
    handleSaveConfig,
    toggleModule,
    toggleLesson,
  }
}
