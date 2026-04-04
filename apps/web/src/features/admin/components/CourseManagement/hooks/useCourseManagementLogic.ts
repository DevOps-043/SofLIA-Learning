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
import { useCourseStats } from './useCourseStats'
import { useCourseStudentDetails } from './useCourseStudentDetails'
import { useCourseReorder } from './useCourseReorder'
import { useCourseConfig } from './useCourseConfig'
import {
  ActiveTab,
  CourseWorkshopPreview,
  FeedbackMessage,
  Instructor,
} from '../types'

export function useCourseManagementLogic(courseId: string) {
  const router = useRouter()
  const isNewCourse = courseId === 'new'

  // ── Tab ────────────────────────────────────────────────────────────────────
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

  // ── Feedback toast ─────────────────────────────────────────────────────────
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null)
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showFeedbackMessage = (type: 'success' | 'error', message: string) => {
    setFeedbackMessage({ type, message })
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setFeedbackMessage(null), 4000)
  }

  // ── Entity selection ───────────────────────────────────────────────────────
  const [selectedModule, setSelectedModule] = useState<AdminModule | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<AdminMaterial | null>(null)
  const [editingActivity, setEditingActivity] = useState<AdminActivity | null>(null)
  const [movingLesson, setMovingLesson] = useState<AdminLesson | null>(null)

  // ── Remote data ────────────────────────────────────────────────────────────
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [workshopPreview, setWorkshopPreview] = useState<CourseWorkshopPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [recalculatingDurations, setRecalculatingDurations] = useState(false)
  const [instructorSignatureUrl, setInstructorSignatureUrl] = useState<string | null>(null)
  const [instructorSignatureName, setInstructorSignatureName] = useState<string | null>(null)
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] = useState<string>('default')

  // ── Domain hooks ───────────────────────────────────────────────────────────
  const { modules, loading: modulesLoading, fetchModules, createModule, updateModule, deleteModule, reorderModules } = useAdminModules()
  const { lessons, loading: lessonsLoading, fetchLessons, createLesson, updateLesson, deleteLesson, reorderLessons } = useAdminLessons(courseId)
  const { materials, getMaterialsByLesson, fetchMaterials, createMaterial, updateMaterial, deleteMaterial } = useAdminMaterials()
  const { activities, getActivitiesByLesson, fetchActivities, createActivity, updateActivity, deleteActivity } = useAdminActivities()

  // ── Sub-hooks ──────────────────────────────────────────────────────────────
  const stats = useCourseStats(courseId, isNewCourse, activeTab)
  const studentDetails = useCourseStudentDetails(courseId, showFeedbackMessage)
  const reorder = useCourseReorder(courseId, modules, lessons, reorderModules, reorderLessons, fetchLessons, showFeedbackMessage)
  const config = useCourseConfig(courseId, isNewCourse, router, workshopPreview, showFeedbackMessage)

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNewCourse) fetchModules(courseId)

    fetch('/api/admin/instructors')
      .then(res => res.json())
      .then(data => { if (data.success) setInstructors(data.instructors || []) })
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
      } catch { /* silent */ }
    }
    loadInstructorSignature()
  }, [courseId])

  useEffect(() => {
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current) }
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getModuleLessons = (moduleId: string) => {
    const fromOrdered = reorder.orderedLessons[moduleId]
    if (fromOrdered && fromOrdered.length > 0) return fromOrdered
    return lessons
      .filter(l => l.module_id === moduleId)
      .sort((a, b) => (a.lesson_order_index || 0) - (b.lesson_order_index || 0))
  }

  const getLessonMaterials = (lessonId: string) => getMaterialsByLesson(lessonId)
  const getLessonActivities = (lessonId: string) => getActivitiesByLesson(lessonId)

  // ── Expand handlers ────────────────────────────────────────────────────────
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) { next.delete(moduleId) } else { next.add(moduleId); fetchLessons(moduleId, courseId) }
      return next
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) { next.delete(lessonId) } else { next.add(lessonId); fetchMaterials(lessonId); fetchActivities(lessonId) }
      return next
    })
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────
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
      showFeedbackMessage('error', error instanceof Error ? error.message : 'Error desconocido al crear la lección')
      throw error
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('¿Estás seguro de eliminar este módulo?')) await deleteModule(moduleId)
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('¿Estás seguro de eliminar esta lección?')) await deleteLesson(lessonId)
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

  const handleRecalculateDurations = async () => {
    try {
      setRecalculatingDurations(true)
      const res = await fetch('/api/admin/recalculate-durations', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showFeedbackMessage('success', data.message || 'Duraciones recalculadas correctamente')
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
    isNewCourse,
    router,
    showFeedbackMessage,

    activeTab,
    setActiveTab,

    expandedModules,
    expandedLessons,
    toggleModule,
    toggleLesson,

    showModuleModal, setShowModuleModal,
    showLessonModal, setShowLessonModal,
    showMaterialModal, setShowMaterialModal,
    showActivityModal, setShowActivityModal,
    showMoveLessonModal, setShowMoveLessonModal,
    showTemplatePreview, setShowTemplatePreview,

    feedbackMessage,

    selectedModule, setSelectedModule,
    selectedLesson, setSelectedLesson,
    editingModuleId, setEditingModuleId,
    editingLessonId, setEditingLessonId,
    editingMaterial, setEditingMaterial,
    editingActivity, setEditingActivity,
    movingLesson, setMovingLesson,

    instructors,
    workshopPreview,
    previewLoading,

    selectedCertificateTemplate, setSelectedCertificateTemplate,
    instructorSignatureUrl,
    instructorSignatureName,

    recalculatingDurations, setRecalculatingDurations,
    handleRecalculateDurations,

    // Config sub-hook
    ...config,

    // Stats sub-hook
    ...stats,

    // Student details sub-hook
    ...studentDetails,

    // Reorder sub-hook
    ...reorder,

    // CRUD handlers
    handleCreateModule,
    handleEditModule,
    handleDeleteModule,
    handleCreateLesson,
    handleDeleteLesson,
    handleMoveLessonToModule,

    // Domain hooks pass-through
    modules, modulesLoading, fetchModules,
    lessons, lessonsLoading, fetchLessons,
    materials, fetchMaterials, createMaterial, updateMaterial, deleteMaterial, getMaterialsByLesson,
    fetchActivities, createActivity, updateActivity, deleteActivity, getActivitiesByLesson,
    updateLesson,

    getModuleLessons,
    getLessonMaterials,
    getLessonActivities,
  }
}
