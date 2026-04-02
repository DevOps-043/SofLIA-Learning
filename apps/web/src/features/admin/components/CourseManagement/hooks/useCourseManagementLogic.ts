'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminModules } from '../../../hooks/useAdminModules'
import { useAdminLessons } from '../../../hooks/useAdminLessons'
import { useAdminMaterials } from '../../../hooks/useAdminMaterials'
import { useAdminActivities } from '../../../hooks/useAdminActivities'
import { AdminModule } from '../../../services/adminModules.service'
import { AdminLesson } from '../../../services/adminLessons.service'
import { AdminMaterial } from '../../../services/adminMaterials.service'
import { AdminActivity } from '../../../services/adminActivities.service'
import { CourseSkill } from '../../../../courses/components/CourseSkillsSelector'
import {
  ActiveTab,
  CourseChartData,
  CourseStudentDetails,
  CourseUserStats,
  CourseWorkshopPreview,
  FeedbackMessage,
  ConfigData,
  DEFAULT_CONFIG_DATA,
  EnrolledUser,
  Instructor,
} from '../types'

export function useCourseManagementLogic(courseId: string) {
  const router = useRouter()
  const isNewCourse = courseId === 'new'

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>(isNewCourse ? 'config' : 'modules')

  // ── Expand/collapse ────────────────────────────────────────────────────────
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  // ── Modal visibility ───────────────────────────────────────────────────────
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showMoveLessonModal, setShowMoveLessonModal] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState<boolean>(false)
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false)

  // ── Feedback toast ─────────────────────────────────────────────────────────
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null)
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Entity selection / editing ─────────────────────────────────────────────
  const [selectedModule, setSelectedModule] = useState<AdminModule | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<AdminMaterial | null>(null)
  const [editingActivity, setEditingActivity] = useState<AdminActivity | null>(null)
  const [movingLesson, setMovingLesson] = useState<AdminLesson | null>(null)

  // ── Remote data ────────────────────────────────────────────────────────────
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [userStats, setUserStats] = useState<CourseUserStats | null>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([])
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<CourseChartData | null>(null)
  const [workshopPreview, setWorkshopPreview] = useState<CourseWorkshopPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)

  // ── Config form ────────────────────────────────────────────────────────────
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [configData, setConfigData] = useState<ConfigData>(DEFAULT_CONFIG_DATA)

  // ── Certificates ───────────────────────────────────────────────────────────
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] = useState<string>('default')
  const [instructorSignatureUrl, setInstructorSignatureUrl] = useState<string | null>(null)
  const [instructorSignatureName, setInstructorSignatureName] = useState<string | null>(null)

  // ── Skills ─────────────────────────────────────────────────────────────────
  const [courseSkills, setCourseSkills] = useState<CourseSkill[]>([])
  const [savingSkills, setSavingSkills] = useState(false)

  // ── Student details ────────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<EnrolledUser | null>(null)
  const [studentDetailsData, setStudentDetailsData] = useState<CourseStudentDetails | null>(null)
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false)

  // ── Recalculate durations ──────────────────────────────────────────────────
  const [recalculatingDurations, setRecalculatingDurations] = useState(false)

  // ── Ordered entities (drag-reorder) ───────────────────────────────────────
  const [orderedModules, setOrderedModules] = useState<AdminModule[]>([])
  const [orderedLessons, setOrderedLessons] = useState<Record<string, AdminLesson[]>>({})
  const reorderTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // ── Domain hooks ───────────────────────────────────────────────────────────
  const {
    modules,
    loading: modulesLoading,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
  } = useAdminModules()

  const {
    lessons,
    loading: lessonsLoading,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
  } = useAdminLessons(courseId)

  const {
    materials,
    getMaterialsByLesson,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useAdminMaterials()

  const {
    activities,
    getActivitiesByLesson,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  } = useAdminActivities()

  // ── Effects ────────────────────────────────────────────────────────────────

  // Initial data load
  useEffect(() => {
    if (!isNewCourse) {
      fetchModules(courseId)
    }

    fetch('/api/admin/instructors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInstructors(data.instructors || [])
        }
      })
      .catch(() => {})

    const loadPreview = async () => {
      if (isNewCourse) return
      try {
        setPreviewLoading(true)
        const res = await fetch(`/api/admin/workshops/${courseId}`)
        const data = await res.json()
        if (res.ok && data?.workshop) setWorkshopPreview(data.workshop)
      } finally {
        setPreviewLoading(false)
      }
    }
    loadPreview()

    const loadInstructorSignature = async () => {
      try {
        const res = await fetch(`/api/auth/me`)
        const data = await res.json()
        if (res.ok && data?.user) {
          if (data.user.signature_url) setInstructorSignatureUrl(data.user.signature_url)
          if (data.user.signature_name) setInstructorSignatureName(data.user.signature_name)
        }
      } catch {
        // silent
      }
    }
    loadInstructorSignature()
  }, [courseId])

  // Sync ordered modules
  useEffect(() => {
    if (modules.length > 0) {
      const sortedModules = [...modules].sort(
        (a, b) => (a.module_order_index || 0) - (b.module_order_index || 0)
      )
      setOrderedModules(sortedModules)
    } else {
      setOrderedModules([])
    }
  }, [modules])

  // Sync ordered lessons by module
  useEffect(() => {
    const lessonsByModule: Record<string, AdminLesson[]> = {}
    lessons.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = []
      }
      lessonsByModule[lesson.module_id].push(lesson)
    })
    Object.keys(lessonsByModule).forEach(moduleId => {
      lessonsByModule[moduleId].sort(
        (a, b) => (a.lesson_order_index || 0) - (b.lesson_order_index || 0)
      )
    })
    setOrderedLessons(lessonsByModule)
  }, [lessons])

  // Populate config form from workshop preview
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
        instructor_id: workshopPreview.instructor_id || '',
      })
    }
  }, [workshopPreview])

  // Cleanup feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  // Load stats when stats tab is active
  useEffect(() => {
    if (activeTab === 'stats') {
      ;(async () => {
        try {
          setStatsLoading(true)
          if (isNewCourse) {
            setStatsLoading(false)
            return
          }
          const res = await fetch(`/api/instructor/workshops/${courseId}/stats`)
          const data = await res.json()
          if (res.ok && data?.stats) {
            setUserStats(data.stats)
            setEnrolledUsers(data.enrolled_users || [])
            setChartData(data.charts || null)
          }
        } catch {
          // silent
        } finally {
          setStatsLoading(false)
        }
      })()
    }
  }, [activeTab, courseId])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showFeedbackMessage = (type: 'success' | 'error', message: string) => {
    setFeedbackMessage({ type, message })
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedbackMessage(null), 4000)
  }

  const getModuleLessons = (moduleId: string) => {
    const fromOrdered = orderedLessons[moduleId]
    if (fromOrdered && fromOrdered.length > 0) return fromOrdered
    return lessons
      .filter(l => l.module_id === moduleId)
      .sort((a, b) => (a.lesson_order_index || 0) - (b.lesson_order_index || 0))
  }

  const getLessonMaterials = (lessonId: string) => getMaterialsByLesson(lessonId)
  const getLessonActivities = (lessonId: string) => getActivitiesByLesson(lessonId)

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleConfigChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setConfigData(prev => ({
      ...prev,
      [name]:
        name === 'price' || name === 'duration_total_minutes' ? Number(value) : value,
    }))
  }

  const handleSaveSkills = async () => {
    try {
      setSavingSkills(true)
      const res = await fetch(`/api/courses/${courseId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: courseSkills }),
        credentials: 'include',
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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingConfig(true)

      const url = isNewCourse
        ? '/api/admin/workshops/create'
        : `/api/admin/workshops/${courseId}`
      const method = isNewCourse ? 'POST' : 'PUT'

      if (!configData.instructor_id && isNewCourse) {
        throw new Error('Debes seleccionar un instructor')
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data?.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors
            .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
            .join('\n')
          throw new Error(`Errores de validación:\n${errorMessages}`)
        }
        throw new Error(
          data?.error || data?.message || 'Error al guardar la configuración'
        )
      }

      if (isNewCourse) {
        const data = await res.json()
        if (data.workshop && data.workshop.id) {
          showFeedbackMessage('success', 'Curso creado correctamente. Redirigiendo...')
          router.replace(`/admin/workshops/${data.workshop.id}`)
          return
        }
      }

      await handleSaveSkills()
      const refreshed = await fetch(`/api/admin/workshops/${courseId}`).then(r => r.json())
      if (refreshed?.workshop) setWorkshopPreview(refreshed.workshop)
      showFeedbackMessage('success', 'Configuración guardada correctamente')
    } catch (err) {
      showFeedbackMessage(
        'error',
        err instanceof Error ? err.message : 'Error al guardar la configuración'
      )
    } finally {
      setSavingConfig(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
        fetchLessons(moduleId, courseId)
      }
      return newSet
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId)
      } else {
        newSet.add(lessonId)
        fetchMaterials(lessonId)
        fetchActivities(lessonId)
      }
      return newSet
    })
  }

  const handleCreateModule = async (data: Record<string, unknown>) => {
    await createModule(courseId, data)
  }

  const handleEditModule = async (moduleId: string, data: Record<string, unknown>) => {
    await updateModule(moduleId, data)
  }

  const handleCreateLesson = async (data: Record<string, unknown>) => {
    if (!editingModuleId) {
      showFeedbackMessage('error', 'Selecciona un módulo antes de crear una lección')
      return
    }
    try {
      await createLesson(editingModuleId, data, courseId)
      await fetchLessons(editingModuleId, courseId)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al crear la lección'
      showFeedbackMessage('error', errorMessage)
      throw error
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('¿Estás seguro de eliminar este módulo?')) {
      await deleteModule(moduleId)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('¿Estás seguro de eliminar esta lección?')) {
      await deleteLesson(lessonId)
    }
  }

  const handleModulesReorder = (newOrder: AdminModule[]) => {
    setOrderedModules(newOrder)

    if (reorderTimeoutRef.current['modules']) {
      clearTimeout(reorderTimeoutRef.current['modules'])
    }

    reorderTimeoutRef.current['modules'] = setTimeout(async () => {
      try {
        const reorderData = newOrder.map((mod, index) => ({
          module_id: mod.module_id,
          module_order_index: index + 1,
        }))
        await reorderModules(courseId, reorderData)
        showFeedbackMessage('success', 'Orden de módulos guardado')
      } catch {
        showFeedbackMessage('error', 'Error al guardar el orden de los módulos')
        setOrderedModules(modules)
      }
    }, 1000)
  }

  const handleLessonsReorder = (moduleId: string, newOrder: AdminLesson[]) => {
    setOrderedLessons(prev => ({ ...prev, [moduleId]: newOrder }))

    const key = `lessons-${moduleId}`
    if (reorderTimeoutRef.current[key]) {
      clearTimeout(reorderTimeoutRef.current[key])
    }

    reorderTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const reorderData = newOrder.map((lesson, index) => ({
          lesson_id: lesson.lesson_id,
          lesson_order_index: index + 1,
        }))
        await reorderLessons(moduleId, reorderData, courseId)
        showFeedbackMessage('success', 'Orden de lecciones guardado')
      } catch {
        showFeedbackMessage('error', 'Error al guardar el orden de las lecciones')
        fetchLessons(moduleId, courseId)
      }
    }, 1000)
  }

  const handleMoveLessonToModule = async (moduleId: string) => {
    if (!movingLesson) return
    try {
      await updateLesson(movingLesson.lesson_id, { module_id: moduleId }, courseId)
      showFeedbackMessage('success', 'Lección movida correctamente')
      setShowMoveLessonModal(false)
      setMovingLesson(null)
      await fetchLessons(movingLesson.module_id, courseId, { silent: true })
      await fetchLessons(moduleId, courseId, { silent: true })
    } catch {
      showFeedbackMessage('error', 'Error al mover la lección')
    }
  }

  const loadStudentDetails = async (userId: string) => {
    try {
      setLoadingStudentDetails(true)
      setStudentDetailsData(null)

      if (!courseId || !userId) {
        console.error('Missing courseId or userId:', { courseId, userId })
        showFeedbackMessage('error', 'Error: Faltan parámetros necesarios')
        setStudentDetailsData(null)
        return
      }

      const response = await fetch(
        `/api/admin/courses/${courseId}/student-details/${userId}`
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Error desconocido' }))
        console.error('API Error:', response.status, errorData)
        showFeedbackMessage(
          'error',
          errorData.error || `Error ${response.status}: No se pudieron cargar los detalles`
        )
        setStudentDetailsData(null)
        return
      }

      const data = await response.json()

      if (data.success) {
        setStudentDetailsData(data.data)
      } else {
        console.error('API returned success=false:', data)
        showFeedbackMessage(
          'error',
          data.error || 'Error al cargar detalles del estudiante'
        )
        setStudentDetailsData(null)
      }
    } catch (error) {
      console.error('Error loading student details:', error)
      showFeedbackMessage(
        'error',
        'Error de conexión al cargar detalles del estudiante'
      )
      setStudentDetailsData(null)
    } finally {
      setLoadingStudentDetails(false)
    }
  }

  const handleRecalculateDurations = async () => {
    try {
      setRecalculatingDurations(true)
      const res = await fetch('/api/admin/recalculate-durations', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showFeedbackMessage(
          'success',
          data.message || 'Duraciones recalculadas correctamente'
        )
        await fetchModules(courseId)
      } else {
        showFeedbackMessage('error', data.error || 'Error al recalcular duraciones')
      }
    } catch {
      showFeedbackMessage('error', 'Error de conexión al recalcular duraciones')
    } finally {
      setRecalculatingDurations(false)
    }
  }

  return {
    // Derived
    isNewCourse,
    router,
    showFeedbackMessage,

    // Tab
    activeTab,
    setActiveTab,

    // Expand/collapse
    expandedModules,
    expandedLessons,
    toggleModule,
    toggleLesson,

    // Modals
    showModuleModal,
    setShowModuleModal,
    showLessonModal,
    setShowLessonModal,
    showMaterialModal,
    setShowMaterialModal,
    showActivityModal,
    setShowActivityModal,
    showMoveLessonModal,
    setShowMoveLessonModal,
    showTemplatePreview,
    setShowTemplatePreview,
    showStudentDetailsModal,
    setShowStudentDetailsModal,

    // Feedback
    feedbackMessage,

    // Entity selection
    selectedModule,
    setSelectedModule,
    selectedLesson,
    setSelectedLesson,
    editingModuleId,
    setEditingModuleId,
    editingLessonId,
    setEditingLessonId,
    editingMaterial,
    setEditingMaterial,
    editingActivity,
    setEditingActivity,
    movingLesson,
    setMovingLesson,

    // Remote data
    instructors,
    userStats,
    enrolledUsers,
    statsLoading,
    chartData,
    workshopPreview,
    previewLoading,

    // Config form
    savingConfig,
    configData,
    setConfigData,
    handleConfigChange,
    handleSaveConfig,

    // Certificates
    selectedCertificateTemplate,
    setSelectedCertificateTemplate,
    instructorSignatureUrl,
    instructorSignatureName,

    // Skills
    courseSkills,
    setCourseSkills,
    savingSkills,

    // Student details
    selectedStudent,
    setSelectedStudent,
    studentDetailsData,
    setStudentDetailsData,
    loadingStudentDetails,
    loadStudentDetails,

    // Reorder
    recalculatingDurations,
    setRecalculatingDurations,
    orderedModules,
    orderedLessons,
    handleModulesReorder,
    handleLessonsReorder,
    handleRecalculateDurations,

    // CRUD handlers
    handleCreateModule,
    handleEditModule,
    handleDeleteModule,
    handleCreateLesson,
    handleDeleteLesson,
    handleMoveLessonToModule,

    // Domain hooks (pass-through for JSX)
    modules,
    modulesLoading,
    fetchModules,
    lessons,
    lessonsLoading,
    fetchLessons,
    materials,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialsByLesson,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivitiesByLesson,
    updateLesson,

    // Helpers
    getModuleLessons,
    getLessonMaterials,
    getLessonActivities,
  }
}
