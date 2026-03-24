'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, GripVertical, Book, FileText, ClipboardList, Flag, Clock, BarChart3, LayoutDashboard, Users2, DollarSign, Star, Sigma, Briefcase, LineChart as LineChartIcon, ListChecks, Pencil, Trash2, Settings, Eye, Award, CheckCircle2, AlertTriangle, TrendingUp, Rocket, Target, Lightbulb, Sprout, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { BarChart, Bar, AreaChart, Area, RadialBarChart, RadialBar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { EnrollmentTrendChart, ProgressDistributionChart, EngagementScatterChart, CompletionRateChart, DonutPieChart } from './AdvancedCharts'
import { useAdminModules } from '../hooks/useAdminModules'
import { useAdminLessons } from '../hooks/useAdminLessons'
import { useAdminMaterials } from '../hooks/useAdminMaterials'
import { useAdminActivities } from '../hooks/useAdminActivities'
import { AdminModule } from '../services/adminModules.service'
import { AdminLesson } from '../services/adminLessons.service'
import { ModuleModal } from './ModuleModal'
import { LessonModal } from './LessonModal'
import { MaterialModal } from './MaterialModal'
import { ActivityModal } from './ActivityModal'
import { ImageUploadCourse } from '@/features/instructor/components/ImageUploadCourse'
import { CertificateTemplatePreview } from './CertificateTemplatePreview'
import { InstructorSignatureUpload } from '@/features/instructor/components/InstructorSignatureUpload'
import { CourseSkillsSelector, CourseSkill } from '@/features/courses/components/CourseSkillsSelector'

interface CourseManagementPageProps {
  courseId: string
}

export function CourseManagementPage({ courseId }: CourseManagementPageProps) {
  const router = useRouter()
  const isNewCourse = courseId === 'new'
  const [activeTab, setActiveTab] = useState<'modules' | 'config' | 'certificates' | 'preview' | 'stats'>(isNewCourse ? 'config' : 'modules')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showMoveLessonModal, setShowMoveLessonModal] = useState(false)
  const [movingLesson, setMovingLesson] = useState<AdminLesson | null>(null)
  
  // Datos del curso
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedModule, setSelectedModule] = useState<AdminModule | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)
  const [editingActivity, setEditingActivity] = useState<any | null>(null)
  const [instructors, setInstructors] = useState<Array<{ id: string, name: string }>>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [enrolledUsers, setEnrolledUsers] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any>(null)
  const [workshopPreview, setWorkshopPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [savingConfig, setSavingConfig] = useState<boolean>(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState<boolean>(false)
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] = useState<string>('default')
  const [instructorSignatureUrl, setInstructorSignatureUrl] = useState<string | null>(null)
  const [instructorSignatureName, setInstructorSignatureName] = useState<string | null>(null)
  const [courseSkills, setCourseSkills] = useState<CourseSkill[]>([])
  const [savingSkills, setSavingSkills] = useState(false)
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentDetailsData, setStudentDetailsData] = useState<any>(null)
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false)
  const [recalculatingDurations, setRecalculatingDurations] = useState(false)
  const [orderedModules, setOrderedModules] = useState<AdminModule[]>([])
  const [orderedLessons, setOrderedLessons] = useState<Record<string, AdminLesson[]>>({})
  const reorderTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})
  const [configData, setConfigData] = useState({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 60,
    price: 0,
    thumbnail_url: '',
    slug: '',
    instructor_id: ''
  })

  const { modules, loading: modulesLoading, fetchModules, createModule, updateModule, deleteModule, reorderModules } = useAdminModules()
  const { lessons, loading: lessonsLoading, fetchLessons, createLesson, updateLesson, deleteLesson, reorderLessons } = useAdminLessons(courseId)
  const { materials, getMaterialsByLesson, fetchMaterials, createMaterial, updateMaterial, deleteMaterial } = useAdminMaterials()
  const { activities, getActivitiesByLesson, fetchActivities, createActivity, updateActivity, deleteActivity } = useAdminActivities()

  useEffect(() => {
    if (!isNewCourse) {
      fetchModules(courseId)
    }
    // Obtener instructores
    fetch('/api/admin/instructors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInstructors(data.instructors || [])
        }
      })
      .catch(err => {/* console.error('Error fetching instructors:', err) */ })

    // Cargar datos para vista previa
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

    // Cargar firma del instructor desde la base de datos
    const loadInstructorSignature = async () => {
      try {
        const res = await fetch(`/api/auth/me`)
        const data = await res.json()
        if (res.ok && data?.user) {
          if (data.user.signature_url) {
            setInstructorSignatureUrl(data.user.signature_url)
          }
          if (data.user.signature_name) {
            setInstructorSignatureName(data.user.signature_name)
          }
        }
      } catch (error) {
        // console.error('Error loading instructor signature:', error)
      }
    }
    loadInstructorSignature()
  }, [courseId])

  // Sincronizar módulos ordenados
  useEffect(() => {
    if (modules.length > 0) {
      const sortedModules = [...modules].sort((a, b) => {
        return (a.module_order_index || 0) - (b.module_order_index || 0);
      });
      setOrderedModules(sortedModules);
    } else {
      setOrderedModules([]);
    }
  }, [modules])

  // Sincronizar lecciones ordenadas por módulo
  useEffect(() => {
    const lessonsByModule: Record<string, AdminLesson[]> = {};
    lessons.forEach(lesson => {
      if (!lessonsByModule[lesson.module_id]) {
        lessonsByModule[lesson.module_id] = [];
      }
      lessonsByModule[lesson.module_id].push(lesson);
    });

    // Ordenar cada grupo de lecciones
    Object.keys(lessonsByModule).forEach(moduleId => {
      lessonsByModule[moduleId].sort((a, b) => (a.lesson_order_index || 0) - (b.lesson_order_index || 0));
    });

    setOrderedLessons(lessonsByModule);
  }, [lessons])

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

  useEffect(() => {
    if (activeTab === 'stats') {
      ; (async () => {
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
            console.log('[CourseManagementPage] Student status by month:', data.charts?.student_status_by_month)
          }
        } catch (e) {
          // console.error('Error cargando estadísticas:', e)
        } finally {
          setStatsLoading(false)
        }
      })()
    }
  }, [activeTab, courseId])

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setConfigData(prev => ({ ...prev, [name]: name === 'price' || name === 'duration_total_minutes' ? Number(value) : value }))
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingConfig(true)

      const url = isNewCourse ? '/api/admin/workshops/create' : `/api/admin/workshops/${courseId}`
      const method = isNewCourse ? 'POST' : 'PUT'

      // Validación básica para instructor_id
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
        // Mostrar errores de validación si existen
        if (data?.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
          throw new Error(`Errores de validación:\n${errorMessages}`)
        }
        throw new Error(data?.error || data?.message || 'Error al guardar la configuración')
      }

      if (isNewCourse) {
        const data = await res.json()
        if (data.workshop && data.workshop.id) {
          showFeedbackMessage('success', 'Curso creado correctamente. Redirigiendo...')
          // Redirigir al curso creado
          router.replace(`/admin/workshops/${data.workshop.id}`)
          return
        }
      }

      await handleSaveSkills()
      const refreshed = await fetch(`/api/admin/workshops/${courseId}`).then(r => r.json())
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

  const handleCreateModule = async (data: any) => {
    await createModule(courseId, data)
  }

  const handleEditModule = async (moduleId: string, data: any) => {
    await updateModule(moduleId, data)
  }

  const handleCreateLesson = async (data: any) => {
    if (!editingModuleId) {
      showFeedbackMessage('error', 'Selecciona un módulo antes de crear una lección')
      return
    }

    try {
      await createLesson(editingModuleId, data, courseId)
      // Refetch lessons después de crear
      await fetchLessons(editingModuleId, courseId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la lección'
      showFeedbackMessage('error', errorMessage)
      throw error // Re-lanzar para que el modal pueda manejarlo si es necesario
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

  const getModuleLessons = (moduleId: string) => {
    const fromOrdered = orderedLessons[moduleId]
    if (fromOrdered && fromOrdered.length > 0) return fromOrdered
    return lessons.filter(l => l.module_id === moduleId).sort((a, b) => (a.lesson_order_index || 0) - (b.lesson_order_index || 0))
  }

  const handleModulesReorder = (newOrder: AdminModule[]) => {
    setOrderedModules(newOrder)
    
    // Debounce API call
    if (reorderTimeoutRef.current['modules']) {
      clearTimeout(reorderTimeoutRef.current['modules'])
    }
    
    reorderTimeoutRef.current['modules'] = setTimeout(async () => {
      try {
        const reorderData = newOrder.map((mod, index) => ({
          module_id: mod.module_id,
          module_order_index: index + 1
        }))
        await reorderModules(courseId, reorderData)
        showFeedbackMessage('success', 'Orden de módulos guardado')
      } catch (error) {
        showFeedbackMessage('error', 'Error al guardar el orden de los módulos')
        setOrderedModules(modules)
      }
    }, 1000)
  }

  const handleLessonsReorder = (moduleId: string, newOrder: AdminLesson[]) => {
    setOrderedLessons(prev => ({ ...prev, [moduleId]: newOrder }))
    
    // Debounce API call
    const key = `lessons-${moduleId}`
    if (reorderTimeoutRef.current[key]) {
      clearTimeout(reorderTimeoutRef.current[key])
    }
    
    reorderTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const reorderData = newOrder.map((lesson, index) => ({
          lesson_id: lesson.lesson_id,
          lesson_order_index: index + 1
        }))
        await reorderLessons(moduleId, reorderData, courseId)
        showFeedbackMessage('success', 'Orden de lecciones guardado')
      } catch (error) {
        showFeedbackMessage('error', 'Error al guardar el orden de las lecciones')
        fetchLessons(moduleId, courseId)
      }
    }, 1000)
  }

  const handleMoveLessonToModule = async (moduleId: string) => {
    if (!movingLesson) return

    try {
      // Usar updateLesson del hook useAdminLessons
      await updateLesson(movingLesson.lesson_id, { module_id: moduleId }, courseId)
      
      showFeedbackMessage('success', 'Lección movida correctamente')
      setShowMoveLessonModal(false)
      setMovingLesson(null)
      
      // Refrescar lecciones de ambos módulos
      await fetchLessons(movingLesson.module_id, courseId, { silent: true })
      await fetchLessons(moduleId, courseId, { silent: true })
    } catch (error) {
      showFeedbackMessage('error', 'Error al mover la lección')
    }
  }

  const loadStudentDetails = async (userId: string) => {
    try {
      setLoadingStudentDetails(true)
      // Limpiar datos anteriores antes de cargar nuevos
      setStudentDetailsData(null)

      if (!courseId || !userId) {
        console.error('Missing courseId or userId:', { courseId, userId })
        showFeedbackMessage('error', 'Error: Faltan parámetros necesarios')
        setStudentDetailsData(null)
        return
      }

      const response = await fetch(`/api/admin/courses/${courseId}/student-details/${userId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('API Error:', response.status, errorData)
        showFeedbackMessage('error', errorData.error || `Error ${response.status}: No se pudieron cargar los detalles`)
        setStudentDetailsData(null)
        return
      }

      const data = await response.json()

      if (data.success) {
        setStudentDetailsData(data.data)
      } else {
        console.error('API returned success=false:', data)
        showFeedbackMessage('error', data.error || 'Error al cargar detalles del estudiante')
        setStudentDetailsData(null)
      }
    } catch (error) {
      console.error('Error loading student details:', error)
      showFeedbackMessage('error', 'Error de conexión al cargar detalles del estudiante')
      setStudentDetailsData(null)
    } finally {
      setLoadingStudentDetails(false)
    }
  }

  const getLessonMaterials = (lessonId: string) => {
    // Usar la función helper del hook que accede directamente al Map
    return getMaterialsByLesson(lessonId)
  }

  const getLessonActivities = (lessonId: string) => {
    // Usar la función helper del hook que accede directamente al Map
    return getActivitiesByLesson(lessonId)
  }

  /**
   * Formatea la duración en minutos a un formato legible
   * - Menos de 60 min: "X min"
   * - 60 min o más: "Xh Ym" o "Xh" si son horas exactas
   */
  const formatDuration = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0 min'

    if (minutes < 60) {
      return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) {
      return `${hours}h`
    }

    return `${hours}h ${remainingMinutes}min`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E9ECEF] via-white to-[#E9ECEF]/50 dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
      {/* Feedback Toast Mejorado */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl border backdrop-blur-md ${feedbackMessage.type === 'success'
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] dark:bg-[#10B981]/20 dark:border-[#10B981]/40 dark:text-[#10B981]'
                : 'bg-red-500/10 border-red-400/30 text-red-600 dark:bg-red-500/20 dark:border-red-400/40 dark:text-red-400'
                }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {feedbackMessage.type === 'success' ? '¡Configuración guardada!' : 'Ocurrió un problema'}
                </p>
                <p className="text-xs opacity-90 mt-0.5">{feedbackMessage.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Rediseñado con Paleta SOFLIA */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <motion.button
            onClick={() => router.back()}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform" />
            <span className="text-sm font-medium">Volver a Talleres</span>
          </motion.button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
                {isNewCourse ? 'Crear Nuevo Curso' : 'Gestión de Curso'}
              </h1>
              <p className="text-[#6C757D] dark:text-white/60 text-sm">
                Administra módulos, lecciones, materiales y actividades
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs Rediseñados con Paleta SOFLIA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 mb-6 p-1.5"
        >
          <div className="flex gap-1.5">
            {[
              { key: 'modules', label: 'Módulos', icon: Book },
              { key: 'config', label: 'Configuración', icon: Settings },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'stats', label: 'Estadísticas', icon: BarChart3 }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => !isNewCourse && setActiveTab(tab.key as any)}
                disabled={isNewCourse && tab.key !== 'config'}
                whileHover={{ scale: (isNewCourse && tab.key !== 'config') ? 1 : 1.02 }}
                whileTap={{ scale: (isNewCourse && tab.key !== 'config') ? 1 : 0.98 }}
                className={`relative flex-1 py-2.5 px-4 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${activeTab === tab.key
                  ? 'text-white'
                  : (isNewCourse && tab.key !== 'config')
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                    : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white'
                  }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 rounded-lg shadow-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <tab.icon className={`w-3.5 h-3.5 relative z-10 ${activeTab === tab.key ? 'text-white' : ''}`} />
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'modules' && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header de Sección Rediseñado */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">Módulos del Curso</h2>
                  <p className="text-xs text-[#6C757D] dark:text-white/60 mt-1">
                    Organiza el contenido en módulos y lecciones
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={async () => {
                      try {
                        setRecalculatingDurations(true)
                        const res = await fetch('/api/admin/recalculate-durations', { method: 'POST' })
                        const data = await res.json()
                        if (data.success) {
                          showFeedbackMessage('success', data.message || 'Duraciones recalculadas correctamente')
                          // Refrescar módulos para mostrar las nuevas duraciones
                          await fetchModules(courseId)
                        } else {
                          showFeedbackMessage('error', data.error || 'Error al recalcular duraciones')
                        }
                      } catch (error) {
                        showFeedbackMessage('error', 'Error de conexión al recalcular duraciones')
                      } finally {
                        setRecalculatingDurations(false)
                      }
                    }}
                    disabled={recalculatingDurations}
                    whileHover={{ scale: recalculatingDurations ? 1 : 1.05, y: recalculatingDurations ? 0 : -2 }}
                    whileTap={{ scale: recalculatingDurations ? 1 : 0.95 }}
                    className="group relative px-3 py-2 bg-[#E9ECEF] dark:bg-[#0A0D12] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 text-[#6C757D] dark:text-white/60 hover:text-[#00D4B3] rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden text-xs font-medium border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Recalcular duraciones de todas las lecciones"
                  >
                    <motion.div
                      animate={recalculatingDurations ? { rotate: 360 } : {}}
                      transition={recalculatingDurations ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </motion.div>
                    <span>{recalculatingDurations ? 'Recalculando...' : 'Recalcular tiempos'}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setSelectedModule(null)
                      setShowModuleModal(true)
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg flex items-center gap-2 shadow-md shadow-[#0A2540]/20 hover:shadow-lg hover:shadow-[#0A2540]/30 transition-all duration-200 overflow-hidden text-sm font-medium"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <motion.div
                      animate={{ rotate: [0, 90, 0] }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.div>
                    <span className="relative z-10">Agregar Módulo</span>
                  </motion.button>
                </div>
              </div>

              {/* Lista de Módulos Rediseñada */}
              {modulesLoading ? (
                <div className="text-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-3 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mx-auto mb-3"
                  />
                  <p className="text-sm text-[#6C757D] dark:text-white/60">Cargando módulos...</p>
                </div>
              ) : modules.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-gradient-to-br from-[#00D4B3]/10 to-[#0A2540]/10 dark:from-[#00D4B3]/20 dark:to-[#0A2540]/20 rounded-xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Book className="w-8 h-8 text-[#00D4B3]" />
                  </motion.div>
                  <p className="text-[#0A2540] dark:text-white text-base mb-1.5 font-semibold">No hay módulos aún</p>
                  <p className="text-[#6C757D] dark:text-white/60 text-xs mb-5">Comienza creando tu primer módulo</p>
                  <motion.button
                    onClick={() => {
                      setSelectedModule(null)
                      setShowModuleModal(true)
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear tu primer módulo</span>
                  </motion.button>
                </motion.div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={orderedModules}
                  onReorder={handleModulesReorder}
                  className="space-y-4 max-w-4xl mx-auto"
                >
                  {orderedModules.map((module, index) => {
                    const moduleLessons = getModuleLessons(module.module_id);
                    const isExpanded = expandedModules.has(module.module_id);

                    return (
                      <Reorder.Item
                        key={module.module_id}
                        value={module}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                      >
                          {/* Borde superior con color según estado */}
                          <div className={`h-1 ${module.is_published
                            ? 'bg-gradient-to-r from-[#10B981] to-[#00D4B3]'
                            : 'bg-gradient-to-r from-[#6C757D] to-[#6C757D]/50'
                            }`} />

                          {/* Contenido del módulo */}
                          <div className="p-5">
                            {/* Header del módulo */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-1">
                                      <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] rounded transition-colors mr-1">
                                        <GripVertical className="w-4 h-4 text-[#6C757D]/40" />
                                      </div>
                                      <motion.button
                                        onClick={() => toggleModule(module.module_id)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#E9ECEF] dark:hover:bg-[#0A0D12] transition-colors"
                                      >
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.3 }}
                                        >
                                          <ChevronDown className="w-5 h-5 text-[#6C757D] dark:text-white/60" />
                                        </motion.div>
                                      </motion.button>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white line-clamp-2 flex-1">
                                      {module.module_title}
                                    </h3>
                                  </div>

                                {/* Badges y metadata */}
                                <div className="flex items-center gap-2 flex-wrap ml-11">
                                  <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg ${module.is_published
                                      ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20'
                                      : 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20 text-[#6C757D] border border-[#6C757D]/20'
                                      }`}
                                  >
                                    {module.is_published ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3" />
                                        Publicado
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-3 h-3" />
                                        Borrador
                                      </>
                                    )}
                                  </motion.span>
                                  <span className="inline-flex items-center gap-1 text-xs text-[#6C757D] dark:text-white/60 px-2.5 py-1 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-lg">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(module.module_duration_minutes || 0)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs text-[#6C757D] dark:text-white/60 px-2.5 py-1 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-lg">
                                    <Book className="w-3 h-3" />
                                    {moduleLessons.length} {moduleLessons.length === 1 ? 'lección' : 'lecciones'}
                                  </span>
                                </div>

                                {/* Descripción si existe */}
                                {module.module_description && (
                                  <p className="text-sm text-[#6C757D] dark:text-white/60 mt-3 ml-11 line-clamp-2">
                                    {module.module_description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Botones de acción Rediseñados */}
                            <div className="flex items-center gap-1.5 ml-11 mt-4 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                              <motion.button
                                onClick={() => {
                                  setEditingModuleId(module.module_id)
                                  setSelectedLesson(null)
                                  setShowLessonModal(true)
                                }}
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 px-2.5 py-1.5 text-xs font-medium text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#00D4B3]/20 dark:border-[#00D4B3]/30"
                                title="Agregar lección"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Lección</span>
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setSelectedModule(module)
                                  setShowModuleModal(true)
                                }}
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-2.5 py-1.5 text-xs font-medium text-[#0A2540] dark:text-white/80 bg-[#E9ECEF] dark:bg-[#0A0D12] hover:bg-[#0A2540]/5 dark:hover:bg-[#0A2540]/20 rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                                title="Editar módulo"
                              >
                                <Pencil className="w-3 h-3" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteModule(module.module_id)}
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 flex items-center justify-center border border-red-200 dark:border-red-900/40"
                                title="Eliminar módulo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Lecciones del Módulo Expandidas */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 pt-0 mt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                                  {moduleLessons.length === 0 ? (
                                    <motion.div
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="text-center py-8 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] rounded-xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
                                    >
                                      <div className="w-12 h-12 bg-gradient-to-br from-[#00D4B3]/20 to-[#0A2540]/20 dark:from-[#00D4B3]/30 dark:to-[#0A2540]/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Plus className="w-6 h-6 text-[#00D4B3]" />
                                      </div>
                                      <p className="text-sm text-[#6C757D] dark:text-white/60 mb-3">No hay lecciones en este módulo</p>
                                      <motion.button
                                        onClick={() => {
                                          setEditingModuleId(module.module_id)
                                          setSelectedLesson(null)
                                          setShowLessonModal(true)
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                        <span>Agrega tu primera lección</span>
                                      </motion.button>
                                    </motion.div>
                                  ) : (
                                    <Reorder.Group
                                      axis="y"
                                      values={moduleLessons}
                                      onReorder={(newOrder) => handleLessonsReorder(module.module_id, newOrder)}
                                      className="space-y-2 mt-2"
                                    >
                                      {moduleLessons.map((lesson, lessonIndex) => {
                                        const isLessonExpanded = expandedLessons.has(lesson.lesson_id);
                                        const lessonMaterials = getLessonMaterials(lesson.lesson_id);
                                        const lessonActivities = getLessonActivities(lesson.lesson_id);

                                        return (
                                          <Reorder.Item
                                            key={lesson.lesson_id}
                                            value={lesson}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: lessonIndex * 0.05 }}
                                            className="bg-[#E9ECEF]/30 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden hover:border-[#00D4B3]/30 dark:hover:border-[#00D4B3]/30 transition-all duration-300"
                                          >
                                            {/* Header de la Lección */}
                                            <div className="p-4 flex items-center justify-between">
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                  <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/50 dark:hover:bg-[#1E2329] rounded transition-colors">
                                                    <GripVertical className="w-4 h-4 text-[#6C757D]/40" />
                                                  </div>
                                                  <motion.button
                                                    onClick={() => toggleLesson(lesson.lesson_id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 dark:hover:bg-[#1E2329] transition-colors"
                                                  >
                                                    <motion.div
                                                      animate={{ rotate: isLessonExpanded ? 180 : 0 }}
                                                      transition={{ duration: 0.2 }}
                                                    >
                                                      <ChevronDown className="w-4 h-4 text-[#6C757D] dark:text-white/60" />
                                                    </motion.div>
                                                  </motion.button>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h4 className="font-semibold text-sm text-[#0A2540] dark:text-white line-clamp-1">
                                                    {lesson.lesson_title}
                                                  </h4>
                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-xs text-[#6C757D] dark:text-white/60 inline-flex items-center gap-1">
                                                      <Clock className="w-3 h-3" />
                                                      {formatDuration(lesson.total_duration_minutes || Math.floor(lesson.duration_seconds / 60))}
                                                    </span>
                                                    {lesson.instructor_name && (
                                                      <span className="text-xs text-[#6C757D] dark:text-white/60">
                                                        por {lesson.instructor_name}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                                                <motion.button
                                                  onClick={() => {
                                                    setSelectedLesson(lesson)
                                                    setEditingModuleId(lesson.module_id)
                                                    setShowLessonModal(true)
                                                  }}
                                                  whileHover={{ scale: 1.1, y: -1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="p-1.5 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 dark:hover:bg-[#10B981]/30 rounded-md transition-all duration-200 border border-[#10B981]/20 dark:border-[#10B981]/30"
                                                  title="Editar lección"
                                                >
                                                  <Pencil className="w-3.5 h-3.5 text-[#10B981]" />
                                                </motion.button>
                                                <motion.button
                                                  onClick={() => {
                                                    setEditingLessonId(lesson.lesson_id)
                                                    setShowMaterialModal(true)
                                                  }}
                                                  whileHover={{ scale: 1.1, y: -1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="p-1.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/30 hover:bg-[#0A2540]/20 dark:hover:bg-[#0A2540]/40 rounded-md transition-all duration-200 border border-[#0A2540]/20 dark:border-[#0A2540]/40"
                                                  title="Agregar material"
                                                >
                                                  <FileText className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
                                                </motion.button>
                                                <motion.button
                                                  onClick={() => {
                                                    setEditingLessonId(lesson.lesson_id)
                                                    setShowActivityModal(true)
                                                  }}
                                                  whileHover={{ scale: 1.1, y: -1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="p-1.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 hover:bg-[#00D4B3]/20 dark:hover:bg-[#00D4B3]/30 rounded-md transition-all duration-200 border border-[#00D4B3]/20 dark:border-[#00D4B3]/30"
                                                  title="Agregar actividad"
                                                >
                                                  <ClipboardList className="w-3.5 h-3.5 text-[#00D4B3]" />
                                                </motion.button>
                                                <motion.button
                                                  onClick={() => handleDeleteLesson(lesson.lesson_id)}
                                                  whileHover={{ scale: 1.1, y: -1 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  className="p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-all duration-200 border border-red-200 dark:border-red-900/40"
                                                  title="Eliminar lección"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                </motion.button>
                                              </div>
                                            </div>

                                            {/* Materiales y Actividades Expandidas */}
                                            <AnimatePresence>
                                              {isLessonExpanded && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="overflow-hidden"
                                                >
                                                  <div className="px-4 pb-4 pt-0 mt-2 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                                      {/* Materiales */}
                                                      <div className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <h5 className="text-xs font-bold text-[#0A2540] dark:text-white flex items-center gap-1.5">
                                                            <FileText className="w-3.5 h-3.5 text-[#0A2540] dark:text-[#00D4B3]" />
                                                            Materiales
                                                            <span className="px-1.5 py-0.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3] rounded text-xs font-semibold">
                                                              {lessonMaterials.length}
                                                            </span>
                                                          </h5>
                                                          <motion.button
                                                            onClick={() => {
                                                              setEditingLessonId(lesson.lesson_id)
                                                              setShowMaterialModal(true)
                                                            }}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="text-xs font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
                                                          >
                                                            + Agregar
                                                          </motion.button>
                                                        </div>
                                                        {lessonMaterials.length === 0 ? (
                                                          <p className="text-xs text-[#6C757D] dark:text-white/40 italic text-center py-3">No hay materiales</p>
                                                        ) : (
                                                          <div className="space-y-1.5">
                                                            {lessonMaterials.map(material => (
                                                              <motion.div
                                                                key={material.material_id}
                                                                whileHover={{ x: 2 }}
                                                                className="text-xs p-2 bg-gradient-to-r from-[#0A2540]/5 to-[#0A2540]/10 dark:from-[#0A2540]/20 dark:to-[#0A2540]/10 rounded-lg border border-[#0A2540]/10 dark:border-[#0A2540]/30 flex items-center justify-between group"
                                                              >
                                                                <div className="flex-1 min-w-0">
                                                                  <div className="font-medium text-[#0A2540] dark:text-white truncate">{material.material_title}</div>
                                                                  <div className="text-[#6C757D] dark:text-white/60 text-xs mt-0.5">
                                                                    {material.material_type}
                                                                  </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                  <motion.button
                                                                    onClick={() => {
                                                                      setEditingMaterial(material)
                                                                      setEditingLessonId(lesson.lesson_id)
                                                                      setShowMaterialModal(true)
                                                                    }}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="p-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 rounded transition-colors"
                                                                    title="Editar material"
                                                                  >
                                                                    <Pencil className="w-3 h-3 text-[#10B981]" />
                                                                  </motion.button>
                                                                  <motion.button
                                                                    onClick={async () => {
                                                                      if (confirm('¿Estás seguro de eliminar este material?')) {
                                                                        await deleteMaterial(material.material_id)
                                                                        await fetchMaterials(lesson.lesson_id)
                                                                      }
                                                                    }}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="p-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                                    title="Eliminar material"
                                                                  >
                                                                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                                                  </motion.button>
                                                                </div>
                                                              </motion.div>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>

                                                      {/* Actividades */}
                                                      <div className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <h5 className="text-xs font-bold text-[#0A2540] dark:text-white flex items-center gap-1.5">
                                                            <ClipboardList className="w-3.5 h-3.5 text-[#00D4B3]" />
                                                            Actividades
                                                            <span className="px-1.5 py-0.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] rounded text-xs font-semibold">
                                                              {lessonActivities.length}
                                                            </span>
                                                          </h5>
                                                          <motion.button
                                                            onClick={() => {
                                                              setEditingLessonId(lesson.lesson_id)
                                                              setShowActivityModal(true)
                                                            }}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="text-xs font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 transition-colors"
                                                          >
                                                            + Agregar
                                                          </motion.button>
                                                        </div>
                                                        {lessonActivities.length === 0 ? (
                                                          <p className="text-xs text-[#6C757D] dark:text-white/40 italic text-center py-3">No hay actividades</p>
                                                        ) : (
                                                          <div className="space-y-1.5">
                                                            {lessonActivities.map(activity => (
                                                              <motion.div
                                                                key={activity.activity_id}
                                                                whileHover={{ x: 2 }}
                                                                className="text-xs p-2 bg-gradient-to-r from-[#00D4B3]/5 to-[#00D4B3]/10 dark:from-[#00D4B3]/20 dark:to-[#00D4B3]/10 rounded-lg border border-[#00D4B3]/10 dark:border-[#00D4B3]/30 flex items-center justify-between group"
                                                              >
                                                                <div className="flex-1 min-w-0">
                                                                  <div className="font-medium text-[#0A2540] dark:text-white truncate">{activity.activity_title}</div>
                                                                  <div className="text-[#6C757D] dark:text-white/60 text-xs mt-0.5">
                                                                    {activity.activity_type}
                                                                  </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                  <motion.button
                                                                    onClick={() => {
                                                                      setEditingActivity(activity)
                                                                      setEditingLessonId(lesson.lesson_id)
                                                                      setShowActivityModal(true)
                                                                    }}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="p-1 bg-[#10B981]/10 dark:bg-[#10B981]/20 hover:bg-[#10B981]/20 rounded transition-colors"
                                                                    title="Editar actividad"
                                                                  >
                                                                    <Pencil className="w-3 h-3 text-[#10B981]" />
                                                                  </motion.button>
                                                                  <motion.button
                                                                    onClick={async () => {
                                                                      if (confirm('¿Estás seguro de eliminar esta actividad?')) {
                                                                        await deleteActivity(activity.activity_id)
                                                                        await fetchActivities(lesson.lesson_id)
                                                                      }
                                                                    }}
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    className="p-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                                    title="Eliminar actividad"
                                                                  >
                                                                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                                                  </motion.button>
                                                                </div>
                                                              </motion.div>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </Reorder.Item>
                                        )
                                      })}
                                    </Reorder.Group>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Reorder.Item>
                      )
                    })}
                </Reorder.Group>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuración */}
        <AnimatePresence mode="wait">
          {activeTab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Columna Principal */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Título */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                  >
                    <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                      Título *
                    </label>
                    <div className="relative">
                      <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                      <input
                        name="title"
                        value={configData.title}
                        onChange={handleConfigChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                        placeholder="Ej: IA Esencial para Principiantes"
                      />
                    </div>
                  </motion.div>

                  {/* Descripción */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                  >
                    <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                      Descripción *
                    </label>
                    <textarea
                      name="description"
                      value={configData.description}
                      onChange={handleConfigChange}
                      rows={6}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Describe el contenido y objetivos del curso..."
                    />
                  </motion.div>

                  {/* Categoría y Nivel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                    >
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                        Categoría *
                      </label>
                      <div className="relative">
                        <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                        <select
                          name="category"
                          value={configData.category}
                          onChange={handleConfigChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                          title="Selecciona la categoría del curso"
                        >
                          <option value="ia">Inteligencia Artificial</option>
                          <option value="tecnologia">Tecnología</option>
                          <option value="negocios">Negocios</option>
                          <option value="diseño">Diseño</option>
                          <option value="marketing">Marketing</option>
                        </select>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                    >
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                        Nivel *
                      </label>
                      <div className="relative">
                        <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                        <select
                          name="level"
                          value={configData.level}
                          onChange={handleConfigChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                          title="Selecciona el nivel del curso"
                        >
                          <option value="beginner">Principiante</option>
                          <option value="intermediate">Intermedio</option>
                          <option value="advanced">Avanzado</option>
                        </select>
                      </div>
                    </motion.div>
                  </div>

                  {/* Duración y Precio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                    >
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                        Duración (minutos) *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                        <input
                          type="number"
                          name="duration_total_minutes"
                          value={configData.duration_total_minutes}
                          onChange={handleConfigChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                          placeholder="60"
                        />
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                      className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                    >
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                        Precio
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          value={configData.price}
                          onChange={handleConfigChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Imagen del Curso */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                  >
                    <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                      Imagen del Curso
                    </label>
                    <ImageUploadCourse
                      value={configData.thumbnail_url}
                      onChange={(url) => setConfigData(prev => ({ ...prev, thumbnail_url: url }))}
                      disabled={savingConfig}
                    />
                  </motion.div>

                  {/* Slug */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                  >
                    <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                      Slug (URL)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                      <input
                        name="slug"
                        value={configData.slug}
                        onChange={handleConfigChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                        placeholder="ia-esencial-principiantes"
                      />
                    </div>
                  </motion.div>

                  {/* Instructor Selector */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.48 }}
                    className="group bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                  >
                    <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                      Instructor *
                    </label>
                    <div className="relative">
                      <Users2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                      <select
                        name="instructor_id"
                        value={configData.instructor_id}
                        onChange={handleConfigChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="">Selecciona un instructor</option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>

                  {/* Skills */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 hover:border-[#00D4B3]/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-[#00D4B3]" />
                      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
                        Skills que se Aprenden en este Curso
                      </label>
                    </div>
                    <p className="text-xs text-[#6C757D] dark:text-white/60 mb-4 ml-6">
                      Selecciona las skills que los estudiantes obtendrán al completar este curso. Estas aparecerán en su perfil.
                    </p>
                    <CourseSkillsSelector
                      courseId={courseId}
                      selectedSkills={courseSkills}
                      onSkillsChange={setCourseSkills}
                      disabled={savingConfig || savingSkills}
                    />
                  </motion.div>
                </div>

                {/* Columna Lateral - Acciones */}
                <div className="space-y-5">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 sticky top-5"
                  >
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                      <Settings className="w-4 h-4 text-[#00D4B3]" />
                      <div className="text-sm font-bold text-[#0A2540] dark:text-white">Acciones</div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={savingConfig}
                      whileHover={{ scale: savingConfig ? 1 : 1.02, y: savingConfig ? 0 : -2 }}
                      whileTap={{ scale: savingConfig ? 1 : 0.98 }}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white disabled:opacity-50 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingConfig ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Guardar configuración</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Vista Previa */}
        <AnimatePresence mode="wait">
          {activeTab === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mb-4"
                  />
                  <p className="text-[#6C757D] dark:text-white/60 text-sm font-medium">Cargando vista previa...</p>
                </div>
              ) : workshopPreview ? (
                <div className="space-y-6">
                  {/* Header con imagen destacada */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative group"
                  >
                    <div className="relative rounded-2xl overflow-hidden border border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] shadow-lg hover:shadow-2xl transition-all duration-500">
                      {/* Imagen de portada con overlay */}
                      <div className="relative h-80 overflow-hidden">
                        {workshopPreview.thumbnail_url ? (
                          <>
                            <motion.img
                              src={workshopPreview.thumbnail_url}
                              alt={workshopPreview.title}
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.6 }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/90 via-[#0A2540]/40 to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0A2540] via-[#0A2540]/90 to-[#00D4B3]/20 flex items-center justify-center">
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="text-[#00D4B3]/30 text-9xl"
                            >
                              ðŸ“š
                            </motion.div>
                          </div>
                        )}

                        {/* Badge de categoría */}
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="absolute top-6 left-6"
                        >
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4B3]/90 backdrop-blur-md text-white text-sm font-semibold shadow-lg">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            {workshopPreview.category || 'Curso'}
                          </span>
                        </motion.div>

                        {/* Badge de nivel */}
                        <motion.div
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="absolute top-6 right-6"
                        >
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md text-white text-sm font-semibold shadow-lg ${workshopPreview.level === 'beginner' ? 'bg-[#10B981]/90' :
                            workshopPreview.level === 'intermediate' ? 'bg-[#F59E0B]/90' :
                              'bg-[#0A2540]/90'
                            }`}>
                            {workshopPreview.level === 'beginner' ? (
                              <span className="flex items-center gap-1.5">
                                <Sprout className="w-4 h-4" />
                                Principiante
                              </span>
                            ) : workshopPreview.level === 'intermediate' ? (
                              <span className="flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4" />
                                Intermedio
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <Rocket className="w-4 h-4" />
                                Avanzado
                              </span>
                            )}
                          </span>
                        </motion.div>

                        {/* Título sobre la imagen */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute bottom-0 left-0 right-0 p-8"
                        >
                          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl">
                            {workshopPreview.title}
                          </h1>
                          <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg line-clamp-2">
                            {workshopPreview.description}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Grid de información y detalles */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna principal - Detalles del curso */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="lg:col-span-2 space-y-6"
                    >
                      {/* Descripción completa */}
                      <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                            <span className="text-2xl">ðŸ“–</span>
                          </div>
                          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Sobre este curso</h2>
                        </div>
                        <p className="text-[#6C757D] dark:text-white/70 leading-relaxed text-base">
                          {workshopPreview.description}
                        </p>
                      </div>

                      {/* Estadísticas del curso */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          {
                            Icon: Clock,
                            label: 'Duración',
                            value: `${workshopPreview.duration_total_minutes} min`,
                            color: 'from-[#00D4B3] to-[#10B981]'
                          },
                          {
                            Icon: BarChart3,
                            label: 'Nivel',
                            value: workshopPreview.level === 'beginner' ? 'Principiante' :
                              workshopPreview.level === 'intermediate' ? 'Intermedio' : 'Avanzado',
                            color: 'from-[#0A2540] to-[#00D4B3]'
                          },
                          {
                            Icon: Target,
                            label: 'Categoría',
                            value: workshopPreview.category || 'General',
                            color: 'from-[#10B981] to-[#00D4B3]'
                          },
                          {
                            Icon: DollarSign,
                            label: 'Precio',
                            value: workshopPreview.price > 0 ? `$${workshopPreview.price}` : 'Gratis',
                            color: 'from-[#F59E0B] to-[#10B981]'
                          }
                        ].map((stat, index) => {
                          const IconComponent = stat.Icon
                          return (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 + index * 0.1 }}
                              whileHover={{ y: -4, scale: 1.02 }}
                              className="relative group"
                            >
                              <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                                <div className="relative">
                                  <div className="mb-2">
                                    <IconComponent className="w-6 h-6 text-[#00D4B3]" />
                                  </div>
                                  <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide mb-1">
                                    {stat.label}
                                  </div>
                                  <div className="text-lg font-bold text-[#0A2540] dark:text-white">
                                    {stat.value}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>

                    {/* Sidebar - Acciones y detalles adicionales */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="space-y-4"
                    >
                      {/* Card de acciones */}
                      <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm sticky top-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4B3] to-[#10B981] flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Vista Previa</h3>
                          </div>

                          {/* Botón principal */}
                          <motion.button
                            onClick={() => {
                              if (workshopPreview.slug) window.open(`/courses/${workshopPreview.slug}`, '_blank')
                            }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative w-full px-6 py-4 bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 hover:from-[#0d2f4d] hover:to-[#0A2540] text-white rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#0A2540]/20 hover:shadow-xl hover:shadow-[#0A2540]/30 transition-all duration-300 overflow-hidden font-semibold"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Eye className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Ver Página Pública</span>
                          </motion.button>

                          {/* Información adicional */}
                          <div className="pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6C757D] dark:text-white/60">Estado</span>
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] text-xs font-semibold">
                                <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                                Publicado
                              </span>
                            </div>

                            {workshopPreview.slug && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#6C757D] dark:text-white/60">URL</span>
                                <code className="px-2 py-1 rounded bg-[#E9ECEF] dark:bg-[#0A0D12] text-[#00D4B3] text-xs font-mono">
                                  /{workshopPreview.slug}
                                </code>
                              </div>
                            )}
                          </div>

                          {/* Tip */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-6 p-4 rounded-xl bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 border border-[#00D4B3]/20"
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00D4B3]/20 flex items-center justify-center">
                                <Lightbulb className="w-4 h-4 text-[#00D4B3]" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#0A2540] dark:text-white mb-1">
                                  Vista Previa en Tiempo Real
                                </p>
                                <p className="text-xs text-[#6C757D] dark:text-white/60 leading-relaxed">
                                  Esta es una vista previa de cómo se verá tu curso para los estudiantes.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1E2329] rounded-2xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A2540]/20 dark:to-[#00D4B3]/20 flex items-center justify-center mb-6">
                    <Eye className="w-10 h-10 text-[#6C757D] dark:text-white/40" />
                  </div>
                  <p className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2">No se encontró el curso</p>
                  <p className="text-[#6C757D] dark:text-white/60 text-sm">Guarda la configuración primero para ver la vista previa</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estadísticas */}
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {statsLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full mb-4"
                  />
                  <p className="text-[#6C757D] dark:text-white/60 text-sm font-medium">Cargando estadísticas...</p>
                </div>
              ) : (
                <>
                  {/* KPIs Principales */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Métricas Clave</h2>
                        <p className="text-sm text-[#6C757D] dark:text-white/60">Indicadores principales de rendimiento</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          icon: Users2,
                          label: 'Estudiantes Inscritos',
                          value: userStats?.total_enrolled ?? 0,
                          change: '+12%',
                          changeType: 'positive',
                          color: 'from-[#0A2540] to-[#00D4B3]'
                        },
                        {
                          icon: TrendingUp,
                          label: 'Tasa de Finalización',
                          value: userStats?.completion_rate ? `${userStats.completion_rate.toFixed(1)}%` : '0%',
                          change: '+5.2%',
                          changeType: 'positive',
                          color: 'from-[#10B981] to-[#00D4B3]'
                        },
                        {
                          icon: Target,
                          label: 'Progreso Promedio',
                          value: userStats ? `${Math.round(userStats.average_progress)}%` : '0%',
                          change: '+8.1%',
                          changeType: 'positive',
                          color: 'from-[#00D4B3] to-[#10B981]'
                        },
                        {
                          icon: Star,
                          label: 'Calificación',
                          value: userStats?.average_rating ? userStats.average_rating.toFixed(1) : '0.0',
                          change: userStats?.total_reviews ? `${userStats.total_reviews} reseñas` : 'Sin reseñas',
                          changeType: 'neutral',
                          color: 'from-[#F59E0B] to-[#10B981]'
                        }
                      ].map((kpi, index) => {
                        const IconComponent = kpi.icon
                        return (
                          <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="relative group"
                          >
                            <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                              <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                                    <IconComponent className="w-6 h-6 text-white" />
                                  </div>
                                  {kpi.changeType !== 'neutral' && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${kpi.changeType === 'positive'
                                      ? 'bg-[#10B981]/10 text-[#10B981]'
                                      : 'bg-red-500/10 text-red-500'
                                      }`}>
                                      {kpi.change}
                                    </span>
                                  )}
                                </div>
                                <div className="text-3xl font-bold text-[#0A2540] dark:text-white mb-1">
                                  {kpi.value}
                                </div>
                                <div className="text-xs font-medium text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                                  {kpi.label}
                                </div>
                                {kpi.changeType === 'neutral' && (
                                  <div className="text-xs text-[#6C757D] dark:text-white/60 mt-2">
                                    {kpi.change}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Gráficas Principales */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfica de Progreso de Estudiantes */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4B3] to-[#10B981] flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Distribución de Progreso</h3>
                          <p className="text-xs text-[#6C757D] dark:text-white/60">Estado actual de los estudiantes</p>
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: '0-25%', value: userStats?.not_started ?? 0, fill: '#F59E0B' },
                                { name: '26-50%', value: Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#00D4B3' },
                                { name: '51-75%', value: Math.floor((userStats?.in_progress ?? 0) * 0.4), fill: '#10B981' },
                                { name: '76-100%', value: (userStats?.completed ?? 0) + Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#0A2540' }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {[
                                { name: '0-25%', value: userStats?.not_started ?? 0, fill: '#F59E0B' },
                                { name: '26-50%', value: Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#00D4B3' },
                                { name: '51-75%', value: Math.floor((userStats?.in_progress ?? 0) * 0.4), fill: '#10B981' },
                                { name: '76-100%', value: (userStats?.completed ?? 0) + Math.floor((userStats?.in_progress ?? 0) * 0.3), fill: '#0A2540' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1E2329',
                                border: '1px solid #6C757D',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              wrapperStyle={{ fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    {/* Gráfica de Actividad en el Tiempo */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                          <LineChartIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Tendencia de Inscripciones</h3>
                          <p className="text-xs text-[#6C757D] dark:text-white/60">Últimos 7 días</p>
                        </div>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[
                            { dia: 'Lun', inscripciones: 12, activos: 45 },
                            { dia: 'Mar', inscripciones: 19, activos: 52 },
                            { dia: 'Mié', inscripciones: 15, activos: 48 },
                            { dia: 'Jue', inscripciones: 22, activos: 61 },
                            { dia: 'Vie', inscripciones: 28, activos: 58 },
                            { dia: 'Sáb', inscripciones: 18, activos: 42 },
                            { dia: 'Dom', inscripciones: 14, activos: 38 }
                          ]}>
                            <defs>
                              <linearGradient id="colorInscripciones" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0A2540" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#0A2540" stopOpacity={0.1} />
                              </linearGradient>
                              <linearGradient id="colorActivos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00D4B3" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00D4B3" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                            <XAxis
                              dataKey="dia"
                              stroke="#6C757D"
                              tick={{ fill: '#6C757D', fontSize: 12 }}
                            />
                            <YAxis
                              stroke="#6C757D"
                              tick={{ fill: '#6C757D', fontSize: 12 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1E2329',
                                border: '1px solid #6C757D',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="inscripciones"
                              stroke="#0A2540"
                              fillOpacity={1}
                              fill="url(#colorInscripciones)"
                              strokeWidth={2}
                            />
                            <Area
                              type="monotone"
                              dataKey="activos"
                              stroke="#00D4B3"
                              fillOpacity={1}
                              fill="url(#colorActivos)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </div>

                  {/* Estadísticas Detalladas */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#00D4B3] flex items-center justify-center">
                        <Sigma className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Análisis Detallado</h2>
                        <p className="text-sm text-[#6C757D] dark:text-white/60">Métricas avanzadas del curso</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: 'Módulos Publicados', value: modules.filter((m: any) => m.is_published).length, total: modules.length, icon: Book, color: '#0A2540' },
                        { label: 'Lecciones Totales', value: userStats?.total_lessons ?? 0, icon: FileText, color: '#00D4B3' },
                        { label: 'Duración Total', value: formatDuration(modules.reduce((acc: number, m: any) => acc + (m.module_duration_minutes || 0), 0)), icon: Clock, color: '#10B981' },
                        { label: 'Materiales', value: userStats?.total_materials ?? 0, icon: ClipboardList, color: '#F59E0B' },
                        { label: 'Actividades', value: userStats?.total_activities ?? 0, icon: Flag, color: '#0A2540' },
                        { label: 'Tasa de Retención', value: userStats?.retention_rate ? `${userStats.retention_rate.toFixed(1)}%` : '0%', icon: Users2, color: '#10B981' },
                        { label: 'Activos 7 días', value: userStats?.active_7d ?? 0, icon: TrendingUp, color: '#00D4B3' },
                        { label: 'Activos 30 días', value: userStats?.active_30d ?? 0, icon: BarChart3, color: '#0A2540' },
                        { label: 'Certificados Emitidos', value: userStats?.total_certificates ?? 0, icon: Award, color: '#F59E0B' }
                      ].map((stat, index) => {
                        const IconComponent = stat.icon
                        return (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-5 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${stat.color}15` }}
                              >
                                <IconComponent className="w-5 h-5" style={{ color: stat.color }} />
                              </div>
                              <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                                {stat.label}
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-[#0A2540] dark:text-white">
                              {stat.value}
                              {stat.total && (
                                <span className="text-sm font-normal text-[#6C757D] dark:text-white/60 ml-2">
                                  / {stat.total}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Gráfica de Estado de Estudiantes */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#10B981] flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Estado de Estudiantes</h3>
                        <p className="text-xs text-[#6C757D] dark:text-white/60">Evolución del progreso en el tiempo</p>
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData?.student_status_by_month || [
                          { mes: 'Nov', completados: 0, enProgreso: 0, noIniciados: 0 }
                        ]}>
                          <defs>
                            <linearGradient id="colorCompletados" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorEnProgreso" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00D4B3" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00D4B3" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorNoIniciados" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                          <XAxis
                            dataKey="mes"
                            stroke="#6C757D"
                            tick={{ fill: '#6C757D', fontSize: 12 }}
                          />
                          <YAxis
                            stroke="#6C757D"
                            tick={{ fill: '#6C757D', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1E2329',
                              border: '1px solid #6C757D',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Legend
                            verticalAlign="top"
                            height={36}
                            wrapperStyle={{ fontSize: '12px' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="completados"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: '#10B981', r: 5 }}
                            activeDot={{ r: 7 }}
                            name="Completados"
                          />
                          <Line
                            type="monotone"
                            dataKey="enProgreso"
                            stroke="#00D4B3"
                            strokeWidth={3}
                            dot={{ fill: '#00D4B3', r: 5 }}
                            activeDot={{ r: 7 }}
                            name="En Progreso"
                          />
                          <Line
                            type="monotone"
                            dataKey="noIniciados"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            dot={{ fill: '#F59E0B', r: 5 }}
                            activeDot={{ r: 7 }}
                            name="No Iniciados"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Lista de Usuarios Inscritos */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                        <ListChecks className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Estudiantes Inscritos</h2>
                        <p className="text-sm text-[#6C757D] dark:text-white/60">{enrolledUsers.length} estudiantes en total</p>
                      </div>
                    </div>

                    {enrolledUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E2329] rounded-2xl border-2 border-dashed border-[#E9ECEF] dark:border-[#6C757D]/30">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A2540]/20 dark:to-[#00D4B3]/20 flex items-center justify-center mb-6">
                          <Users2 className="w-10 h-10 text-[#6C757D] dark:text-white/40" />
                        </div>
                        <p className="text-[#0A2540] dark:text-white text-lg font-semibold mb-2">No hay estudiantes inscritos</p>
                        <p className="text-[#6C757D] dark:text-white/60 text-sm">Los estudiantes aparecerán aquí cuando se inscriban al curso</p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12]">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Estudiante</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Progreso</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Inscrito</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Última Actividad</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-[#0A2540] dark:text-white uppercase tracking-wider">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                              {enrolledUsers.map((user: any) => (
                                <motion.tr
                                  key={user.enrollment_id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  whileHover={{ backgroundColor: 'rgba(0, 212, 179, 0.05)' }}
                                  className="transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      {user.profile_picture ? (
                                        <img src={user.profile_picture} alt={user.display_name} className="w-10 h-10 rounded-full border-2 border-[#00D4B3]" />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white font-bold text-sm">
                                          {user.display_name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-sm font-semibold text-[#0A2540] dark:text-white">{user.display_name}</div>
                                        <div className="text-xs text-[#6C757D] dark:text-white/60">{user.email || user.username}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${user.enrollment_status === 'completed' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' :
                                      user.enrollment_status === 'active' ? 'bg-[#00D4B3]/10 text-[#00D4B3] border border-[#00D4B3]/30' :
                                        'bg-[#6C757D]/10 text-[#6C757D] border border-[#6C757D]/30'
                                      }`}>
                                      <span className={`w-2 h-2 rounded-full ${user.enrollment_status === 'completed' ? 'bg-[#10B981]' :
                                        user.enrollment_status === 'active' ? 'bg-[#00D4B3] animate-pulse' :
                                          'bg-[#6C757D]'
                                        }`} />
                                      {user.enrollment_status === 'completed' ? 'Completado' :
                                        user.enrollment_status === 'active' ? 'Activo' :
                                          user.enrollment_status === 'paused' ? 'Pausado' :
                                            user.enrollment_status === 'cancelled' ? 'Cancelado' : 'Desconocido'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-full h-2.5 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${user.progress_percentage}%` }}
                                          transition={{ duration: 1, ease: "easeOut" }}
                                          className="h-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3] rounded-full"
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-[#0A2540] dark:text-white min-w-[3rem] text-right">
                                        {Math.round(user.progress_percentage)}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-[#6C757D] dark:text-white/70">
                                    {user.enrolled_at ? new Date(user.enrolled_at).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'â€”'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-[#6C757D] dark:text-white/70">
                                    {user.last_accessed_at ? new Date(user.last_accessed_at).toLocaleDateString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'Nunca'}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center">
                                      <motion.button
                                        onClick={async () => {
                                          setSelectedStudent(user)
                                          setShowStudentDetailsModal(true)
                                          await loadStudentDetails(user.user_id)
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-3 py-1.5 bg-gradient-to-r from-[#0A2540] to-[#00D4B3] hover:from-[#0d2f4d] hover:to-[#00D4B3] text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        Ver Detalles
                                      </motion.button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modales */}
        {showModuleModal && (
          <ModuleModal
            module={selectedModule}
            onClose={() => {
              setShowModuleModal(false)
              setSelectedModule(null)
            }}
            onSave={async (data) => {
              if (selectedModule) {
                await handleEditModule(selectedModule.module_id, data)
              } else {
                await handleCreateModule(data)
              }
              setShowModuleModal(false)
            }}
          />
        )}

        {showLessonModal && editingModuleId && (
          <LessonModal
            moduleId={editingModuleId}
            lesson={selectedLesson}
            onClose={() => {
              setShowLessonModal(false)
              setSelectedLesson(null)
              setEditingModuleId(null)
            }}
            onSave={async (data) => {
              try {
                if (selectedLesson) {
                  // Editar lección existente
                  await updateLesson(selectedLesson.lesson_id, data, courseId)
                  await fetchLessons(editingModuleId, courseId)
                } else {
                  // Crear nueva lección
                  await handleCreateLesson(data)
                }
                // Solo cerrar el modal si no hay errores
                setShowLessonModal(false)
                setSelectedLesson(null)
                setEditingModuleId(null)
              } catch (error) {
                // El error ya fue manejado en handleCreateLesson o updateLesson
                // No cerrar el modal para que el usuario pueda corregir
                throw error
              }
            }}
            instructors={instructors}
          />
        )}

        {showMaterialModal && editingLessonId && (
          <MaterialModal
            material={editingMaterial}
            lessonId={editingLessonId}
            onClose={() => {
              setShowMaterialModal(false)
              setEditingLessonId(null)
              setEditingMaterial(null)
            }}
            onSave={async (data) => {
              if (editingMaterial) {
                // Editar material existente
                await updateMaterial(editingMaterial.material_id, data)
                await fetchMaterials(editingLessonId)
              } else {
                // Crear nuevo material
                await createMaterial(editingLessonId, data)
                await fetchMaterials(editingLessonId)
              }
              setShowMaterialModal(false)
              setEditingLessonId(null)
              setEditingMaterial(null)
            }}
          />
        )}

        {showActivityModal && editingLessonId && (
          <ActivityModal
            activity={editingActivity}
            lessonId={editingLessonId}
            onClose={() => {
              setShowActivityModal(false)
              setEditingLessonId(null)
              setEditingActivity(null)
            }}
            onSave={async (data) => {
              if (editingActivity) {
                // Editar actividad existente
                await updateActivity(editingActivity.activity_id, data)
                await fetchActivities(editingLessonId)
              } else {
                // Crear nueva actividad
                await createActivity(editingLessonId, data)
                await fetchActivities(editingLessonId)
              }
              setShowActivityModal(false)
              setEditingLessonId(null)
              setEditingActivity(null)
            }}
          />
        )}

        {/* Modal de Preview de Plantillas de Certificados */}
        <CertificateTemplatePreview
          key={`cert-preview-${instructorSignatureName || 'no-name'}-${instructorSignatureUrl || 'no-url'}`}
          isOpen={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          selectedTemplate={selectedCertificateTemplate}
          onSelectTemplate={(templateId) => {
            setSelectedCertificateTemplate(templateId)
          }}
          instructorSignatureUrl={instructorSignatureUrl}
          instructorSignatureName={instructorSignatureName}
          instructorDisplayName={workshopPreview?.instructor_name || undefined}
          studentName={workshopPreview?.title ? 'Estudiante Ejemplo' : undefined}
          courseName={workshopPreview?.title || undefined}
          issueDate={new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        />

        {/* Modal de Detalles del Estudiante */}
        <AnimatePresence>
          {showStudentDetailsModal && selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowStudentDetailsModal(false)
                setStudentDetailsData(null)
                setSelectedStudent(null)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              >
                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-[#0A2540] to-[#00D4B3] p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedStudent.profile_picture ? (
                        <img
                          src={selectedStudent.profile_picture}
                          alt={selectedStudent.display_name}
                          className="w-16 h-16 rounded-full border-4 border-white/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                          {selectedStudent.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedStudent.display_name}</h2>
                        <p className="text-white/80 text-sm">{selectedStudent.email || selectedStudent.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowStudentDetailsModal(false)
                        setStudentDetailsData(null)
                        setSelectedStudent(null)
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Settings className="w-5 h-5 rotate-0 hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>
                </div>

                {/* Contenido del Modal */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* KPIs Principales del Estudiante */}
                  {loadingStudentDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full"
                      />
                    </div>
                  ) : studentDetailsData ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      {[
                        {
                          icon: Target,
                          label: 'Progreso Total',
                          value: `${Math.round(studentDetailsData.enrollment?.progressPercentage || selectedStudent.progress_percentage || 0)}%`,
                          color: 'from-[#0A2540] to-[#00D4B3]'
                        },
                        {
                          icon: Clock,
                          label: 'Tiempo de Estudio',
                          value: `${studentDetailsData.studySessions?.totalCourseStudyTime || studentDetailsData.studySessions?.totalStudyTime || 0} hrs`,
                          color: 'from-[#00D4B3] to-[#10B981]'
                        },
                        {
                          icon: CheckCircle2,
                          label: 'Actividades Completadas',
                          value: `${studentDetailsData.engagement?.activitiesCompleted || 0}`,
                          color: 'from-[#10B981] to-[#00D4B3]'
                        },
                        {
                          icon: TrendingUp,
                          label: 'Racha de Días',
                          value: `${studentDetailsData.studySessions?.studyStreak || 0} días`,
                          color: 'from-[#F59E0B] to-[#10B981]'
                        }
                      ].map((kpi, index) => {
                        const IconComponent = kpi.icon
                        return (
                          <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-2xl font-bold text-[#0A2540] dark:text-white mb-1">
                              {kpi.value}
                            </div>
                            <div className="text-xs font-medium text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                              {kpi.label}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : null}

                  {/* Gráficas y Estadísticas Detalladas */}
                  {studentDetailsData && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Gráfica de Progreso Semanal */}
                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Progreso Semanal</h3>
                              <p className="text-xs text-[#6C757D] dark:text-white/60">Últimos 7 días</p>
                            </div>
                          </div>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={studentDetailsData.studySessions?.weeklyProgress || [
                                { dia: 'Lun', progreso: 0 },
                                { dia: 'Mar', progreso: 0 },
                                { dia: 'Mié', progreso: 0 },
                                { dia: 'Jue', progreso: 0 },
                                { dia: 'Vie', progreso: 0 },
                                { dia: 'Sáb', progreso: 0 },
                                { dia: 'Dom', progreso: 0 }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#1E2329',
                                    border: '1px solid #6C757D',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Bar dataKey="progreso" fill="#00D4B3" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Gráfica de Tiempo de Estudio */}
                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#00D4B3] flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Tiempo de Estudio</h3>
                              <p className="text-xs text-[#6C757D] dark:text-white/60">Distribución por día</p>
                            </div>
                          </div>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={studentDetailsData.studySessions?.dailyStudyTime || [
                                { dia: 'Lun', horas: 0 },
                                { dia: 'Mar', horas: 0 },
                                { dia: 'Mié', horas: 0 },
                                { dia: 'Jue', horas: 0 },
                                { dia: 'Vie', horas: 0 },
                                { dia: 'Sáb', horas: 0 },
                                { dia: 'Dom', horas: 0 }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#1E2329',
                                    border: '1px solid #6C757D',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="horas"
                                  stroke="#10B981"
                                  strokeWidth={3}
                                  dot={{ fill: '#10B981', r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Métricas de Engagement */}
                      <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-6 border border-[#E9ECEF] dark:border-[#6C757D]/30 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#10B981] flex items-center justify-center">
                            <Users2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Métricas de Engagement</h3>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">Nivel de participación del estudiante</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Sesiones Totales', value: `${studentDetailsData.studySessions?.totalSessions || 0}`, icon: LayoutDashboard },
                            { label: 'Promedio Diario', value: `${studentDetailsData.engagement?.avgDailyTime || 0} hrs`, icon: Clock },
                            { label: 'Lecciones Vistas', value: `${studentDetailsData.engagement?.lessonsViewed || 0}`, icon: Book },
                            { label: 'Notas Creadas', value: `${studentDetailsData.engagement?.notesCreated || 0}`, icon: FileText }
                          ].map((metric, index) => {
                            const IconComponent = metric.icon
                            return (
                              <div key={metric.label} className="text-center">
                                <div className="flex items-center justify-center mb-2">
                                  <IconComponent className="w-5 h-5 text-[#00D4B3]" />
                                </div>
                                <div className="text-xl font-bold text-[#0A2540] dark:text-white mb-1">
                                  {metric.value}
                                </div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60">
                                  {metric.label}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Estadísticas de Interacción con SofLIA */}
                      <div className="bg-gradient-to-br from-[#0A2540]/5 to-[#00D4B3]/5 dark:from-[#0A2540]/10 dark:to-[#00D4B3]/10 rounded-xl p-6 border-2 border-[#00D4B3]/30 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center shadow-lg">
                            <Lightbulb className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#0A2540] dark:text-white">Interacción con SofLIA</h3>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">Análisis de conversaciones y asistencia personalizada</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {[
                            {
                              icon: Rocket,
                              label: 'Conversaciones Totales',
                              value: `${studentDetailsData.lia?.totalConversations || 0}`,
                              sublabel: `${studentDetailsData.lia?.conversationsThisWeek || 0} esta semana`,
                              color: 'from-[#0A2540] to-[#00D4B3]'
                            },
                            {
                              icon: Sprout,
                              label: 'Mensajes Intercambiados',
                              value: `${studentDetailsData.lia?.totalMessages || 0}`,
                              sublabel: `Promedio: ${studentDetailsData.lia?.avgMessagesPerConversation || 0} por conversación`,
                              color: 'from-[#00D4B3] to-[#10B981]'
                            },
                            {
                              icon: Star,
                              label: 'Feedback Positivo',
                              value: `${studentDetailsData.lia?.positiveFeedbackRate || 0}%`,
                              sublabel: `${studentDetailsData.lia?.positiveFeedbackCount || 0} de ${studentDetailsData.lia?.totalConversations || 0} conversaciones`,
                              color: 'from-[#10B981] to-[#00D4B3]'
                            }
                          ].map((metric, index) => {
                            const IconComponent = metric.icon
                            return (
                              <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className="bg-white dark:bg-[#1E2329] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                                    <IconComponent className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-2xl font-bold text-[#0A2540] dark:text-white">
                                      {metric.value}
                                    </div>
                                    <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide">
                                      {metric.label}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60 mt-2">
                                  {metric.sublabel}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>

                        {/* Gráfica de Conversaciones con SofLIA */}
                        <div className="bg-white dark:bg-[#1E2329] rounded-xl p-5 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-2 mb-4">
                            <Rocket className="w-5 h-5 text-[#00D4B3]" />
                            <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Frecuencia de Conversaciones</h4>
                          </div>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={studentDetailsData.lia?.conversationsByWeek?.map((week: any, index: number) => ({
                                semana: week.week || `S${index + 1}`,
                                conversaciones: week.count || 0
                              })) || [
                                  { semana: 'S1', conversaciones: 0 },
                                  { semana: 'S2', conversaciones: 0 },
                                  { semana: 'S3', conversaciones: 0 },
                                  { semana: 'S4', conversaciones: 0 },
                                  { semana: 'S5', conversaciones: 0 }
                                ]}>
                                <defs>
                                  <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00D4B3" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00D4B3" stopOpacity={0.1} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                <XAxis dataKey="semana" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#1E2329',
                                    border: '1px solid #6C757D',
                                    borderRadius: '8px',
                                    color: '#fff'
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="conversaciones"
                                  stroke="#00D4B3"
                                  fillOpacity={1}
                                  fill="url(#colorConversaciones)"
                                  strokeWidth={2}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Análisis de Temas de Conversación */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          {(studentDetailsData.lia?.conversationTopics || [
                            { tema: 'Dudas de Lecciones', count: 0, color: '#0A2540' },
                            { tema: 'Ayuda con Actividades', count: 0, color: '#00D4B3' },
                            { tema: 'Explicaciones Extra', count: 0, color: '#10B981' },
                            { tema: 'Motivación', count: 0, color: '#F59E0B' }
                          ]).map((tema: any, index: number) => (
                            <div key={tema.tema} className="bg-white dark:bg-[#1E2329] rounded-lg p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30 text-center">
                              <div
                                className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: tema.color }}
                              >
                                {tema.count}
                              </div>
                              <div className="text-xs font-medium text-[#6C757D] dark:text-white/60">
                                {tema.tema}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Estadísticas de Sesiones de Estudio */}
                      <div className="bg-gradient-to-br from-[#10B981]/5 to-[#F59E0B]/5 dark:from-[#10B981]/10 dark:to-[#F59E0B]/10 rounded-xl p-6 border-2 border-[#10B981]/30 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#F59E0B] flex items-center justify-center shadow-lg">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-[#0A2540] dark:text-white">Hábitos de Estudio</h3>
                            <p className="text-xs text-[#6C757D] dark:text-white/60">Análisis de patrones y comportamiento de aprendizaje</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          {[
                            {
                              icon: Clock,
                              label: 'Sesiones Totales',
                              value: `${studentDetailsData.studySessions?.totalSessions || 0}`,
                              sublabel: studentDetailsData.studySessions?.lastSession?.hoursAgo
                                ? `Última: Hace ${studentDetailsData.studySessions.lastSession.hoursAgo} horas`
                                : 'Sin sesiones',
                              color: 'from-[#10B981] to-[#00D4B3]'
                            },
                            {
                              icon: TrendingUp,
                              label: 'Duración Promedio',
                              value: `${studentDetailsData.studySessions?.avgSessionDuration || 0} min`,
                              sublabel: 'Por sesión',
                              color: 'from-[#00D4B3] to-[#10B981]'
                            },
                            {
                              icon: Target,
                              label: 'Tiempo Total',
                              value: `${studentDetailsData.studySessions?.totalCourseStudyTime || studentDetailsData.studySessions?.totalStudyTime || 0} hrs`,
                              sublabel: 'En este curso',
                              color: 'from-[#F59E0B] to-[#10B981]'
                            },
                            {
                              icon: BarChart3,
                              label: 'Frecuencia Semanal',
                              value: `${studentDetailsData.studySessions?.weeklyFrequency || 0} días`,
                              sublabel: 'Promedio por semana',
                              color: 'from-[#0A2540] to-[#00D4B3]'
                            }
                          ].map((metric, index) => {
                            const IconComponent = metric.icon
                            return (
                              <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="bg-white dark:bg-[#1E2329] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                              >
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-3`}>
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-[#0A2540] dark:text-white mb-1">
                                  {metric.value}
                                </div>
                                <div className="text-xs font-semibold text-[#6C757D] dark:text-white/60 uppercase tracking-wide mb-2">
                                  {metric.label}
                                </div>
                                <div className="text-xs text-[#6C757D] dark:text-white/60">
                                  {metric.sublabel}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>

                        {/* Patrones de Estudio */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Horarios Preferidos */}
                          <div className="bg-white dark:bg-[#1E2329] rounded-xl p-5 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="w-5 h-5 text-[#10B981]" />
                              <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Horarios Preferidos</h4>
                            </div>
                            <div className="space-y-3">
                              {(studentDetailsData.studySessions?.preferredTimeSlots || [
                                { periodo: 'Mañana (6am-12pm)', porcentaje: 0, color: '#F59E0B' },
                                { periodo: 'Tarde (12pm-6pm)', porcentaje: 0, color: '#00D4B3' },
                                { periodo: 'Noche (6pm-12am)', porcentaje: 0, color: '#10B981' },
                                { periodo: 'Madrugada (12am-6am)', porcentaje: 0, color: '#6C757D' }
                              ]).map((horario: any) => (
                                <div key={horario.periodo}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-[#6C757D] dark:text-white/70">{horario.periodo}</span>
                                    <span className="text-xs font-bold text-[#0A2540] dark:text-white">{horario.porcentaje}%</span>
                                  </div>
                                  <div className="w-full bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${horario.porcentaje}%`, backgroundColor: horario.color }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Días Más Activos */}
                          <div className="bg-white dark:bg-[#1E2329] rounded-xl p-5 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                            <div className="flex items-center gap-2 mb-4">
                              <BarChart3 className="w-5 h-5 text-[#00D4B3]" />
                              <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Días Más Activos</h4>
                            </div>
                            <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={studentDetailsData.studySessions?.activeDays || [
                                  { dia: 'L', sesiones: 0 },
                                  { dia: 'M', sesiones: 0 },
                                  { dia: 'X', sesiones: 0 },
                                  { dia: 'J', sesiones: 0 },
                                  { dia: 'V', sesiones: 0 },
                                  { dia: 'S', sesiones: 0 },
                                  { dia: 'D', sesiones: 0 }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" opacity={0.3} />
                                  <XAxis dataKey="dia" stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 10 }} />
                                  <YAxis stroke="#6C757D" tick={{ fill: '#6C757D', fontSize: 10 }} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#1E2329',
                                      border: '1px solid #6C757D',
                                      borderRadius: '8px',
                                      color: '#fff',
                                      fontSize: '12px'
                                    }}
                                  />
                                  <Bar dataKey="sesiones" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insights de SofLIA */}
                      {studentDetailsData.studySessions && (
                        <div className="mt-4 bg-white dark:bg-[#1E2329] rounded-xl p-4 border-l-4 border-[#00D4B3]">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lightbulb className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-[#0A2540] dark:text-white mb-1">Insights de SofLIA</h5>
                              <p className="text-xs text-[#6C757D] dark:text-white/70 leading-relaxed">
                                {studentDetailsData.studySessions.preferredTimeSlots && studentDetailsData.studySessions.preferredTimeSlots.length > 0 ? (
                                  <>
                                    Este estudiante muestra un patrón de estudio{' '}
                                    {studentDetailsData.studySessions.preferredTimeSlots.find((s: any) => s.porcentaje === Math.max(...studentDetailsData.studySessions.preferredTimeSlots.map((s: any) => s.porcentaje)))?.periodo.toLowerCase() || 'consistente'}.
                                    {' '}Frecuencia semanal: {studentDetailsData.studySessions.weeklyFrequency} días.
                                    {' '}Duración promedio: {studentDetailsData.studySessions.avgSessionDuration} minutos por sesión.
                                    {studentDetailsData.studySessions.studyStreak > 0 && ` Racha actual: ${studentDetailsData.studySessions.studyStreak} días consecutivos.`}
                                  </>
                                ) : (
                                  'Aún no hay suficientes datos para generar insights personalizados.'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Información Adicional */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Flag className="w-4 h-4 text-[#00D4B3]" />
                            <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Estado de Inscripción</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Estado:</span>
                              <span className={`font-semibold ${selectedStudent.enrollment_status === 'completed' ? 'text-[#10B981]' :
                                selectedStudent.enrollment_status === 'active' ? 'text-[#00D4B3]' :
                                  'text-[#6C757D]'
                                }`}>
                                {selectedStudent.enrollment_status === 'completed' ? 'Completado' :
                                  selectedStudent.enrollment_status === 'active' ? 'Activo' :
                                    selectedStudent.enrollment_status === 'paused' ? 'Pausado' : 'Cancelado'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Inscrito:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">
                                {selectedStudent.enrolled_at ? new Date(selectedStudent.enrolled_at).toLocaleDateString('es-ES') : 'â€”'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Última Actividad:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">
                                {selectedStudent.last_accessed_at ? new Date(selectedStudent.last_accessed_at).toLocaleDateString('es-ES') : 'Nunca'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl p-4 border border-[#E9ECEF] dark:border-[#6C757D]/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-[#F59E0B]" />
                            <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">Logros y Certificados</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Certificados:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Badges Obtenidos:</span>
                              <span className="font-semibold text-[#0A2540] dark:text-white">3</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C757D] dark:text-white/60">Ranking:</span>
                              <span className="font-semibold text-[#00D4B3]">Top 15%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer del Modal */}
                <div className="border-t border-[#E9ECEF] dark:border-[#6C757D]/30 p-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12]/50">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowStudentDetailsModal(false)
                        setStudentDetailsData(null)
                        setSelectedStudent(null)
                      }}
                      className="px-4 py-2 bg-[#6C757D]/10 hover:bg-[#6C757D]/20 text-[#6C757D] dark:text-white/70 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Cerrar
                    </button>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-[#0A2540] to-[#00D4B3] hover:from-[#0d2f4d] hover:to-[#00D4B3] text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                    >
                      Enviar Mensaje
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal para mover lección */}
        <AnimatePresence>
          {showMoveLessonModal && movingLesson && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMoveLessonModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Mover Lección</h3>
                    <p className="text-xs text-[#6C757D] dark:text-white/60">Selecciona el módulo de destino</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {modules.map((module) => (
                    <motion.button
                      key={module.module_id}
                      onClick={() => handleMoveLessonToModule(module.module_id)}
                      disabled={module.module_id === movingLesson.module_id}
                      whileHover={module.module_id !== movingLesson.module_id ? { x: 4, backgroundColor: 'rgba(0,0,0,0.05)' } : {}}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        module.module_id === movingLesson.module_id
                          ? 'bg-[#E9ECEF]/50 border-transparent opacity-50 cursor-not-allowed'
                          : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Book className={`w-4 h-4 ${module.module_id === movingLesson.module_id ? 'text-[#6C757D]' : 'text-[#00D4B3]'}`} />
                        <span className="text-sm font-medium text-[#0A2540] dark:text-white truncate max-w-[200px]">
                          {module.module_title}
                        </span>
                      </div>
                      {module.module_id === movingLesson.module_id ? (
                        <span className="text-[10px] font-bold text-[#6C757D] uppercase tracking-wider">Actual</span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#6C757D]/30 group-hover:text-[#00D4B3] transition-colors" />
                      )}
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex justify-end">
                  <button
                    onClick={() => setShowMoveLessonModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-[#6C757D] hover:text-[#0A2540] dark:text-white/60 dark:hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}