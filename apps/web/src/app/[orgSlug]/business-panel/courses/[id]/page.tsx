'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Star,
  BookOpen,
  Play,
  CheckCircle,
  Users,
  Award,
  FileText,
  Video,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Calendar,
  BarChart3,
  Globe,
  Linkedin,
  Github,
  Mail,
  Sparkles,
  Target,
  Zap,
  Shield,
  Trophy,
  TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@aprende-y-aplica/ui'
import { BusinessAssignCourseModal } from '@/features/business-panel/components/BusinessAssignCourseModal'
import { CourseAnalyticsTab } from '@/features/business-panel/components/CourseAnalyticsTab'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface CourseDetail {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  instructor: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
    bio: string | null
    linkedin_url: string | null
    github_url: string | null
    website_url: string | null
    location: string | null
    cargo_rol: string | null
    type_rol: string | null
  } | null
  duration: number | null
  thumbnail_url: string | null
  slug: string | null
  price: number | null
  rating: number
  student_count: number
  review_count: number
  learning_objectives: string[]
  created_at: string
  updated_at: string
  stats: {
    total_modules: number
    total_lessons: number
    total_duration_minutes: number
  }
  modules: Array<{
    module_id: string
    module_title: string
    module_description: string | null
    module_order_index: number
    module_duration_minutes: number | null
    is_required: boolean
    lessons: Array<{
      lesson_id: string
      lesson_title: string
      lesson_description: string | null
      lesson_order_index: number
      duration_seconds: number
      video_provider: string
      video_provider_id: string
    }>
  }>
  reviews: Array<{
    id: string
    title: string | null
    content: string
    rating: number
    is_verified: boolean
    created_at: string
    user: {
      name: string
      profile_picture_url: string | null
    }
  }>
  subscription_status?: {
    has_subscription: boolean
    is_purchased: boolean
    is_organization_purchased: boolean
    can_assign: boolean
    can_purchase_for_free?: boolean
    monthly_course_count?: number
    max_courses_per_period?: number
  }
}

export default function BusinessCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const orgSlug = params.orgSlug as string
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  // Theme Colors
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
  const accentColor = panelStyles?.accent_color || '#10B981'
  const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'reviews' | 'instructor' | 'analytics'>('info')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('ID de curso no válido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })

        const responseText = await response.text()
        if (!responseText) throw new Error('Respuesta vacía del servidor')

        const data = JSON.parse(responseText)

        if (!response.ok) {
          throw new Error(data?.error || `Error ${response.status}`)
        }

        if (data.success && data.course) {
          setCourse(data.course)
          if (data.course.modules?.length > 0) {
            setExpandedModules(new Set([data.course.modules[0].module_id]))
          }
        } else {
          throw new Error(data.error || 'Error al cargar el curso')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatDurationSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getLevelStyles = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return { bg: `${accentColor}20`, color: accentColor, text: 'Principiante' }
      case 'intermediate':
      case 'intermedio':
        return { bg: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', text: 'Intermedio' }
      case 'advanced':
      case 'avanzado':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', text: 'Avanzado' }
      default:
        return { bg: `${primaryColor}20`, color: primaryColor, text: level || 'N/A' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePurchase = async () => {
    setIsPurchasing(true)
    setPurchaseError(null)
    setPurchaseSuccess(false)

    try {
      const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al adquirir el curso')
      }

      setPurchaseSuccess(true)

      const courseResponse = await fetch(`/api/${orgSlug}/business/courses/${courseId}`, { credentials: 'include' })
      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        if (courseData.success && courseData.course) {
          setCourse(courseData.course)
        }
      }
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : 'Error al adquirir el curso')
    } finally {
      setIsPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen animate-pulse">
        <div className="h-10 w-32 bg-white/5 rounded-xl mb-8" />
        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
          <div className="2xl:col-span-2 space-y-6">
            <div className="h-80 bg-white/5 rounded-2xl" />
            <div className="h-48 bg-white/5 rounded-2xl" />
          </div>
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="p-6 lg:p-8 min-h-screen">
        <button
          onClick={() => router.push(`/${params.orgSlug}/business-panel/courses`)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div
          className="rounded-3xl p-16 border text-center shadow-sm"
          style={{ backgroundColor: cardBackground, borderColor: borderColor }}
        >
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <BookOpen className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>{error || 'Curso no encontrado'}</h3>
          <p className="text-sm" style={{ color: `${textColor}70` }}>El curso con ID "{courseId}" no existe o no tienes acceso.</p>
        </div>
      </div>
    )
  }

  const levelStyles = getLevelStyles(course.level)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-8 min-h-screen"
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all mb-8 shadow-sm"
        style={{ 
          borderColor: borderColor, 
          backgroundColor: cardBackground,
          color: textColor 
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-medium">Volver a Cursos</span>
      </motion.button>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
        {/* Main Content - Left Column */}
        <div className="2xl:col-span-2 space-y-6">

          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden border shadow-sm"
            style={{ backgroundColor: cardBackground, borderColor: borderColor }}
          >
            {/* Thumbnail with Overlay */}
            <div className="relative h-72 xl:h-80">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)` }}
                >
                  <BookOpen className="w-24 h-24" style={{ color: `${primaryColor}50` }} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

              {/* Badges positioned on image */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {course.category && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
                    style={{ backgroundColor: `${primaryColor}90`, color: '#fff' }}>
                    {course.category}
                  </span>
                )}
                {course.level && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
                    style={{ backgroundColor: levelStyles.bg, color: levelStyles.color }}>
                    {levelStyles.text}
                  </span>
                )}
              </div>
            </div>

            {/* Course Info */}
            <div className="p-6 xl:p-8">
              <h1 className="text-2xl xl:text-3xl font-bold mb-4" style={{ color: textColor }}>
                {course.title}
              </h1>

              {course.description && (
                <p className="text-base mb-6 line-clamp-3" style={{ color: isDark ? 'rgba(255,255,255,0.9)' : `${textColor}80` }}>
                  {course.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" fill="#FACC15" />
                  <span className="font-bold" style={{ color: textColor }}>{course.rating.toFixed(1)}</span>
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}60` }}>({course.review_count} reseñas)</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>
                  <Users className="w-5 h-5" />
                  <span>{course.student_count.toLocaleString()} estudiantes</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>
                  <Clock className="w-5 h-5" />
                  <span>{formatDuration(course.stats.total_duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>
                  <Video className="w-5 h-5" />
                  <span>{course.stats.total_lessons} lecciones</span>
                </div>
              </div>

              {/* Instructor Preview */}
              {course.instructor && (
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                  {course.instructor.profile_picture_url ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image src={course.instructor.profile_picture_url} alt={course.instructor.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center !text-white font-bold"
                      style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                    >
                      {course.instructor.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold" style={{ color: textColor }}>{course.instructor.name}</p>
                    <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}60` }}>Instructor del curso</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ backgroundColor: cardBackground, borderColor: borderColor }}
          >
            <div className="flex overflow-x-auto border-b" style={{ scrollbarWidth: 'none', borderColor: borderColor }}>
              {[
                { id: 'info', label: 'Información', icon: BookOpen },
                { id: 'content', label: 'Contenido', icon: FileText },
                { id: 'reviews', label: 'Reseñas', icon: Star },
                { id: 'instructor', label: 'Instructor', icon: GraduationCap },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="group flex-1 flex items-center justify-center relative px-3 py-4 transition-all duration-300"
                    style={{
                      color: isActive ? '#10B981' : (isDark ? 'rgba(255,255,255,0.85)' : `${textColor}80`),
                      backgroundColor: isActive ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 'transparent'
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span 
                      className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                        isActive 
                          ? 'max-w-[150px] ml-2 opacity-100' 
                          : 'max-w-0 opacity-0 ml-0 group-hover:max-w-[150px] group-hover:ml-2 group-hover:opacity-100'
                      }`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: '#10B981' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="space-y-8">
                      {/* Learning Objectives */}
                      {course.learning_objectives?.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                            <Target className="w-6 h-6" style={{ color: primaryColor }} />
                            Lo que aprenderás
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {course.learning_objectives.map((objective, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3 p-4 rounded-xl border"
                                style={{ backgroundColor: `${primaryColor}08`, borderColor: borderColor }}
                              >
                                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                                <span style={{ color: `${textColor}90` }}>{objective}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
                        {[
                          { icon: FileText, label: 'Módulos', value: course.stats.total_modules },
                          { icon: Video, label: 'Lecciones', value: course.stats.total_lessons },
                          { icon: Clock, label: 'Duración', value: formatDuration(course.stats.total_duration_minutes) },
                          { icon: Users, label: 'Estudiantes', value: course.student_count.toLocaleString() }
                        ].map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-xl border"
                            style={{ 
                              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)', 
                              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : borderColor 
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <stat.icon className="w-5 h-5" style={{ color: '#10B981' }} />
                              <span className="text-sm font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: textColor }}>{stat.value}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Description */}
                      {course.description && (
                        <div>
                          <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>Descripción del Curso</h3>
                          <p className="leading-relaxed whitespace-pre-line" style={{ color: `${textColor}80` }}>
                            {course.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'content' && (
                  <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold" style={{ color: textColor }}>Contenido del Curso</h3>
                        <span className="text-sm" style={{ color: `${textColor}60` }}>
                          {course.stats.total_modules} módulos • {course.stats.total_lessons} lecciones
                        </span>
                      </div>

                      {course.modules.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border border-white/10" style={{ backgroundColor: `${primaryColor}05` }}>
                          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: `${textColor}30` }} />
                          <p style={{ color: `${textColor}50` }}>Este curso aún no tiene contenido disponible</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {course.modules.map((module, moduleIndex) => {
                            const isExpanded = expandedModules.has(module.module_id)
                            // Usar calculated_duration_minutes que incluye videos + materiales + actividades
                            const moduleDurationMinutes = (module as any).calculated_duration_minutes ||
                              module.module_duration_minutes ||
                              Math.round(module.lessons.reduce((sum, l) => sum + l.duration_seconds, 0) / 60)

                            return (
                              <motion.div
                                key={module.module_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: moduleIndex * 0.05 }}
                                className="rounded-xl border overflow-hidden"
                                style={{ backgroundColor: isExpanded ? `${primaryColor}08` : 'transparent', borderColor: borderColor }}
                              >
                                <button
                                  onClick={() => toggleModule(module.module_id)}
                                  className="w-full px-5 py-4 flex items-center justify-between hover:opacity-80 transition-colors"
                  				  style={{ backgroundColor: isExpanded ? 'transparent' : 'transparent' }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                                      style={{ 
                                        backgroundColor: isExpanded ? primaryColor : `${primaryColor}40`,
                                        color: isExpanded ? '#FFFFFF' : (isDark ? '#FFFFFF' : primaryColor)
                                      }}
                                    >
                                      {moduleIndex + 1}
                                    </div>
                                    <div className="text-left">
                                      <h4 className="font-semibold" style={{ color: textColor }}>{module.module_title}</h4>
                                      <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>
                                        {module.lessons.length} lecciones • {formatDuration(moduleDurationMinutes)}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronDown
                                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}
                                  />
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-5 pb-4 space-y-2">
                                        {module.lessons.map((lesson, lessonIndex) => (
                                          <div
                                            key={lesson.lesson_id}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                                          >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: isDark ? `${primaryColor}40` : `${primaryColor}50` }}>
                                              <Play className="w-4 h-4" style={{ color: '#FFFFFF', strokeWidth: 3 }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium" style={{ color: textColor }}>
                                                {lessonIndex + 1}. {lesson.lesson_title}
                                              </p>
                                            </div>
                                            <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>
                                              {formatDurationSeconds(lesson.duration_seconds)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {course.reviews.length === 0 ? (
                      <div className="text-center py-12">
                        <Star className="w-16 h-16 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : `${textColor}30` }} />
                        <p style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>Aún no hay reseñas para este curso</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {course.reviews.map((review, index) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-5 rounded-xl border"
                            style={{ backgroundColor: `${primaryColor}05`, borderColor: borderColor }}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center !text-white font-bold flex-shrink-0"
                                style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                              >
                                {review.user.name[0].toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold" style={{ color: textColor }}>{review.user.name}</h4>
                                  {review.is_verified && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                      Verificado
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                  ))}
                                  <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>{formatDate(review.created_at)}</span>
                                </div>
                                {review.title && <h5 className="font-medium mb-2" style={{ color: textColor }}>{review.title}</h5>}
                                <p className="text-sm leading-relaxed" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}80` }}>{review.content}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'instructor' && (
                  <motion.div key="instructor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {course.instructor ? (
                      <div className="space-y-6">
                        {/* Instructor Profile */}
                        <div className="flex items-start gap-6">
                          {course.instructor.profile_picture_url ? (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: primaryColor }}>
                              <Image src={course.instructor.profile_picture_url} alt={course.instructor.name} fill className="object-cover" />
                            </div>
                          ) : (
                              <div
                                className="w-24 h-24 rounded-2xl flex items-center justify-center !text-white text-3xl font-bold flex-shrink-0"
                                style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                              >
                                {course.instructor.name[0].toUpperCase()}
                              </div>
                          )}
                          <div>
                            <h3 className="text-2xl font-bold mb-1" style={{ color: textColor }}>{course.instructor.name}</h3>
                            <p className="text-lg mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}60` }}>Instructor</p>
                            <div className="flex items-center gap-3">
                              {course.instructor.linkedin_url && (
                                <a href={course.instructor.linkedin_url} target="_blank" rel="noopener noreferrer"
                                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                  style={{ backgroundColor: '#0077B520', color: '#0077B5' }}>
                                  <Linkedin className="w-5 h-5" />
                                </a>
                              )}
                              {course.instructor.github_url && (
                                <a href={course.instructor.github_url} target="_blank" rel="noopener noreferrer"
                                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white transition-colors hover:bg-white/20">
                                  <Github className="w-5 h-5" />
                                </a>
                              )}
                              {course.instructor.website_url && (
                                <a href={course.instructor.website_url} target="_blank" rel="noopener noreferrer"
                                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                                  <Globe className="w-5 h-5" />
                                </a>
                              )}
                              {course.instructor.email && (
                                <a href={`mailto:${course.instructor.email}`}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                                  <Mail className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        {course.instructor.bio && (
                          <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: `${primaryColor}05` }}>
                            <h4 className="font-bold mb-3" style={{ color: textColor }}>Biografía</h4>
                            <p className="leading-relaxed whitespace-pre-line" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}80` }}>
                              {course.instructor.bio}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div
                          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}15` }}
                        >
                          <GraduationCap className="w-10 h-10" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : `${textColor}40` }} />
                        </div>
                        <h4 className="text-lg font-semibold mb-2" style={{ color: textColor }}>
                          Información del instructor no disponible
                        </h4>
                        <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>
                          Este curso aún no tiene un instructor asignado o la información no está disponible.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'analytics' && course && (
                  <CourseAnalyticsTab courseId={course.id} orgSlug={orgSlug} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4 sm:p-6 border sticky top-6 shadow-sm"
            style={{ backgroundColor: cardBackground, borderColor: borderColor }}
          >
            {/* Price Section */}
            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b" style={{ borderColor: borderColor }}>
              {course.subscription_status?.is_organization_purchased ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xl sm:text-2xl font-bold block truncate" style={{ color: accentColor }}>Adquirido</span>
                    <p className="text-xs sm:text-sm truncate" style={{ color: `${textColor}60` }}>Listo para asignar</p>
                  </div>
                </div>
              ) : course.subscription_status?.can_purchase_for_free ? (
                <div>
                  <span className="text-3xl font-bold" style={{ color: primaryColor }}>Gratis</span>
                  <p className="text-sm mt-1" style={{ color: `${textColor}60` }}>Incluido en tu membresía</p>
                </div>
              ) : (
                <div>
                  <span className="text-3xl font-bold" style={{ color: textColor }}>
                    ${course.price?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-sm ml-2" style={{ color: `${textColor}60` }}>USD</span>
                </div>
              )}
            </div>

            {/* Messages */}
            {purchaseSuccess && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl border flex items-center gap-3"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: accentColor }} />
                <span className="text-sm font-medium" style={{ color: accentColor }}>¡Curso adquirido exitosamente!</span>
              </motion.div>
            )}

            {purchaseError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl border flex items-center gap-3"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }}>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">{purchaseError}</span>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={course.subscription_status?.is_organization_purchased ? () => setIsAssignModalOpen(true) : handlePurchase}
              disabled={isPurchasing || course.subscription_status?.has_subscription === false}
              className="w-full py-4 rounded-xl font-semibold !text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: primaryColor,
                color: '#FFFFFF',
                boxShadow: `0 8px 30px ${primaryColor}40`
              }}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin !text-white" color="#FFFFFF" />
                  <span className="!text-white" style={{ color: '#FFFFFF' }}>Procesando...</span>
                </>
              ) : course.subscription_status?.is_organization_purchased ? (
                <>
                  <Users className="w-5 h-5 !text-white" color="#FFFFFF" />
                  <span className="!text-white" style={{ color: '#FFFFFF' }}>Asignar a Usuarios</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 !text-white" color="#FFFFFF" />
                  <span className="!text-white" style={{ color: '#FFFFFF' }}>Adquirir Curso</span>
                </>
              )}
            </motion.button>

            {course.subscription_status?.has_subscription === false && (
              <p className="text-center text-sm mt-3" style={{ color: `${textColor}50` }}>
                Requiere una membresía activa
              </p>
            )}

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
              {[
                { icon: Shield, text: 'Acceso de por vida' },
                { icon: Video, text: `${course.stats.total_lessons} lecciones en video` },
                { icon: Award, text: 'Certificado de finalización' },
                { icon: TrendingUp, text: `Actualizado ${formatDate(course.updated_at)}` }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <feature.icon className="w-5 h-5" style={{ color: accentColor }} />
                  <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}80` }}>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Rating Summary */}
            {course.rating > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-6 h-6 text-yellow-400" fill="#FACC15" />
                      <span className="text-2xl font-bold" style={{ color: textColor }}>{course.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>{course.review_count} reseñas</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Assign Course Modal */}
      {course && (
        <BusinessAssignCourseModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
          orgSlug={orgSlug}
          onAssignComplete={() => { }}
        />
      )}
    </motion.div>
  )
}
