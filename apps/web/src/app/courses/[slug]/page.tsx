'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Star, 
  BookOpen, 
  Play,
  Heart,
  Share2,
  CheckCircle,
  Award,
  Users,
  Calendar,
  FileText,
  Search,
  FileCheck,
  ArrowRight,
  Settings,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Video,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { CourseService, CourseWithInstructor } from '../../../features/courses/services/course.service';
import { StarRating } from '../../../features/courses/components/StarRating';
import { createClient } from '../../../lib/supabase/client';
import { SuccessModal } from '../../../core/components/SuccessModal';
import { ErrorModal } from '../../../core/components/ErrorModal';
import { SkillBadgeList } from '../../../features/skills/components/SkillBadgeList';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const slug = params.slug as string;
  
  const [course, setCourse] = useState<CourseWithInstructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'instructor'>('info');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [modules, setModules] = useState<any[]>([]);
  const [instructorData, setInstructorData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [courseSkills, setCourseSkills] = useState<any[]>([]);

  useEffect(() => {
    async function loadCourseData() {
      if (!slug) return;

      try {
        setLoading(true);
        setCheckingPurchase(true);

        // Obtener idioma actual del usuario desde i18n
        const userLanguage = i18n.language || 'es';
        
        // ⚡ Paralelizar: Curso + Purchase Check + Modules
        const [courseResponse, purchaseResponse, modulesResponse] = await Promise.all([
          fetch(`/api/courses/${slug}?lang=${userLanguage}`),
          fetch(`/api/courses/${slug}/check-purchase`),
          fetch(`/api/courses/${slug}/modules?lang=${userLanguage}`)
        ]);

        // Procesar curso
        if (!courseResponse.ok) {
          throw new Error('Curso no encontrado');
        }
        const courseData = await courseResponse.json();
        setCourse(courseData);
        setIsFavorite(courseData.isFavorite || false);

        // Cargar skills del curso
        if (courseData.id) {
          try {
            const skillsResponse = await fetch(`/api/courses/${courseData.id}/skills`);
            if (skillsResponse.ok) {
              const skillsData = await skillsResponse.json();
              if (skillsData.success && Array.isArray(skillsData.skills)) {
                setCourseSkills(skillsData.skills);
              }
            }
          } catch (err) {
            console.error('Error loading course skills:', err);
          }
        }

        // Procesar purchase
        if (purchaseResponse.ok) {
          const purchaseData = await purchaseResponse.json();
          setIsPurchased(purchaseData.isPurchased);
        }

        // Procesar módulos
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          if (Array.isArray(modulesData)) {
            setModules(modulesData);
            if (modulesData.length > 0) {
              setExpandedModules(new Set([modulesData[0].module_id || modulesData[0].id]));
            }
          } else if (modulesData.modules && Array.isArray(modulesData.modules)) {
            setModules(modulesData.modules);
            if (modulesData.modules.length > 0) {
              setExpandedModules(new Set([modulesData.modules[0].module_id || modulesData.modules[0].id]));
            }
          } else {
            setModules([]);
          }
        }

        // OPTIMIZACIÓN: Cargar instructor en background (no bloquea el render)
        if (courseData?.instructor_id) {
          // Fire and forget - no bloqueamos el loading principal
          (async () => {
            try {
              const supabase = createClient();
              const { data: instructorData } = await supabase
                .from('users')
                .select('id, first_name, last_name, display_name, username, profile_picture_url, bio, linkedin_url, cargo_rol')
                .eq('id', courseData.instructor_id)
                .single();

              if (instructorData) {
                setInstructorData(instructorData);
              }
            } catch (err) {
            }
          })();
        }

      } catch (err) {
        setError('Error al cargar el curso');
      } finally {
        setLoading(false);
        setCheckingPurchase(false);
      }
    }

    loadCourseData();
  }, [slug]);


  const handlePurchase = async () => {
    if (!course) return;
    
    setIsPurchasing(true);
    try {
      const response = await fetch(`/api/courses/${slug}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al adquirir el curso');
      }

      // Mostrar mensaje de éxito con el modal personalizado
      setSuccessMessage(`¡Curso "${data.data.course_title}" adquirido exitosamente!`);
      setShowSuccessModal(true);
      
      // Actualizar el estado de compra optimísticamente
      setIsPurchased(true);

      // Recargar el estado de compra desde el servidor después de un pequeño delay
      // para asegurar que la transacción se haya completado en la BD
      setTimeout(async () => {
        try {
          const checkPurchaseResponse = await fetch(`/api/courses/${slug}/check-purchase`, {
            cache: 'no-store', // Evitar cache para obtener el estado más reciente
          });
          if (checkPurchaseResponse.ok) {
            const purchaseData = await checkPurchaseResponse.json();
            setIsPurchased(purchaseData.isPurchased || false);
          }
        } catch (checkError) {
          // Si falla la verificación, mantener el estado optimista
        }
      }, 500); // Esperar 500ms para que la transacción se complete
      
    } catch (error) {
      // Mostrar error con el modal de error
      setErrorMessage(error instanceof Error ? error.message : 'Error al adquirir el curso');
      setShowErrorModal(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Aquí iría la lógica para guardar en favoritos
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return 'General';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'principiante':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
      case 'intermedio':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
      case 'avanzado':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDurationSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary/50 border-t-primary dark:border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-lg">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{error || 'No se pudo cargar el curso'}</p>
          <button 
            onClick={() => router.back()} 
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Calcular estadísticas del curso
  const totalModules = modules.length;
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const totalDuration = course.estimatedDuration || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-h-screen bg-white dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 dark:hover:text-white rounded-lg border border-gray-200 dark:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 mb-8 bg-white dark:bg-slate-800 shadow-lg">
        {course.thumbnail ? (
          <div className="relative h-96 bg-gray-200 dark:bg-slate-700">
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent dark:from-slate-900 dark:via-slate-900/50"></div>
            
            {/* Background Graphics */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-20 left-1/4 w-16 h-16">
                <Search className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="absolute top-32 right-1/4 w-14 h-14">
                <FileCheck className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="absolute top-40 left-1/2 w-12 h-12">
                <ArrowRight className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="absolute bottom-32 right-1/3 w-14 h-14">
                <Settings className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="absolute bottom-24 right-1/4 w-12 h-12">
                <ArrowRight className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="absolute bottom-32 left-1/3 w-16 h-16">
                <TrendingUp className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
              <div className="absolute top-1/2 left-1/2 w-20 h-20">
                <BarChart3 className="w-full h-full text-cyan-400" strokeWidth={1.5} />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {course.category && (
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold border border-primary/30">
                        {course.category}
                      </span>
                    )}
                    {course.difficulty && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(course.difficulty)}`}>
                        {getDifficultyText(course.difficulty)}
                      </span>
                    )}
                    {totalModules > 0 && (
                      <span className="px-3 py-1 bg-white/20 dark:bg-slate-700/50 text-white dark:text-slate-300 rounded-full text-xs font-semibold border border-white/30 dark:border-slate-600">
                        {totalModules} módulos
                      </span>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {course.title}
                  </h1>
                  <div className="flex items-center gap-6 flex-wrap">
                    {(course.rating && course.rating > 0) || (course.review_count && course.review_count > 0) ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <StarRating
                            rating={course.rating || 0}
                            size="md"
                            showRatingNumber={course.rating && course.rating > 0}
                            reviewCount={course.review_count}
                          />
                        </div>
                        {course.review_count && course.review_count > 0 && (
                          <span className="text-white/80 dark:text-slate-300 text-sm">
                            ({course.review_count} {course.review_count === 1 ? 'reseña' : 'reseñas'})
                          </span>
                        )}
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 text-white/80 dark:text-slate-300">
                      <Users className="w-5 h-5" />
                      <span>{course.student_count?.toLocaleString() || '0'} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 dark:text-slate-300">
                      <Clock className="w-5 h-5" />
                      <span>{formatDuration(course.estimatedDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 dark:text-slate-300">
                      <Calendar className="w-5 h-5" />
                      <span>Actualizado {formatDate(course.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center">
            <BookOpen className="w-32 h-32 text-primary/30" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none">
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              {[
                { id: 'info', label: 'Información', icon: BookOpen },
                { id: 'content', label: 'Contenido', icon: FileText },
                { id: 'instructor', label: 'Instructor', icon: User }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/20 text-primary border-b-2 border-primary'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      {/* Learning Objectives */}
                      {course.learning_objectives && course.learning_objectives.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lo que aprenderás</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {course.learning_objectives.map((objective: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-slate-200">{objective}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {course.description && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Descripción del Curso</h3>
                          <p className="text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {course.description}
                          </p>
                        </div>
                      )}

                      {/* Skills que Aprenderás */}
                      {courseSkills.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills que Aprenderás</h3>
                          <SkillBadgeList
                            skills={courseSkills.map(skill => ({
                              skill_id: skill.skill_id,
                              name: skill.name,
                              slug: skill.slug,
                              description: skill.description,
                              category: skill.category,
                              icon_url: skill.icon_url || null,
                              level: skill.user_level || null,
                              badge_url: skill.user_badge_url || null,
                              course_count: skill.user_course_count || 0
                            }))}
                            showFilter={false}
                            size="sm"
                            layout="overlap"
                          />
                        </div>
                      )}

                      {/* Course Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-gray-600 dark:text-slate-300 text-sm">Módulos</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalModules || '0'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-5 h-5 text-primary" />
                            <span className="text-gray-600 dark:text-slate-300 text-sm">Lecciones</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLessons || '0'}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="text-gray-600 dark:text-slate-300 text-sm">Duración</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(totalDuration)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-primary" />
                            <span className="text-gray-600 dark:text-slate-300 text-sm">Estudiantes</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{course.student_count?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'content' && (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Contenido del Curso
                        </h3>
                        <span className="text-gray-600 dark:text-slate-300 text-sm">
                          {totalModules} módulos • {totalLessons} lecciones • {formatDuration(totalDuration)}
                        </span>
                      </div>

                      {modules.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-slate-300">Este curso aún no tiene contenido disponible</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {modules.map((module, moduleIndex) => {
                            const isExpanded = expandedModules.has(module.module_id || module.id);
                            const moduleLessons = module.lessons || [];
                            const moduleDuration = module.module_duration_minutes 
                              ? module.module_duration_minutes * 60 
                              : moduleLessons.reduce((sum: number, l: any) => sum + (l.duration_seconds || 0), 0);
                            
                            return (
                              <div
                                key={module.module_id || module.id}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none"
                              >
                                <button
                                  onClick={() => toggleModule(module.module_id || module.id)}
                                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4 flex-1 text-left">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                      isExpanded ? 'bg-primary' : 'bg-gray-400 dark:bg-slate-600'
                                    }`}>
                                      {moduleIndex + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-gray-900 dark:text-white font-semibold mb-1">{module.module_title || module.title}</h4>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                                        <span>{moduleLessons.length} {moduleLessons.length === 1 ? 'lección' : 'lecciones'}</span>
                                        <span>{formatDurationSeconds(moduleDuration)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                                  )}
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
                                      <div className="px-6 pb-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4">
                                        {module.module_description && (
                                          <p className="text-gray-600 dark:text-slate-300 text-sm mb-4">{module.module_description}</p>
                                        )}
                                        {moduleLessons.map((lesson: any, lessonIndex: number) => (
                                          <div
                                            key={lesson.lesson_id || lesson.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600"
                                          >
                                            <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" style={{ strokeWidth: 2.5 }} />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-gray-900 dark:text-white text-sm font-medium">
                                                {lessonIndex + 1}. {lesson.lesson_title || lesson.title}
                                              </p>
                                              {lesson.lesson_description && (
                                                <p className="text-gray-600 dark:text-slate-300 text-xs mt-1 line-clamp-1">
                                                  {lesson.lesson_description}
                                                </p>
                                              )}
                                            </div>
                                            <span className="text-gray-500 dark:text-slate-400 text-xs flex-shrink-0">
                                              {formatDurationSeconds(lesson.duration_seconds || 0)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'instructor' && (
                  <motion.div
                    key="instructor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="space-y-6">
                      <div className="flex items-start gap-6">
                        {instructorData?.profile_picture_url ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                            <Image
                              src={instructorData.profile_picture_url}
                              alt={course.instructor_name || 'Instructor'}
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="96px"
                              quality={75}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 border-2 border-primary">
                            {course.instructor_name?.[0]?.toUpperCase() || 'I'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {instructorData?.display_name || 
                             (instructorData?.first_name && instructorData?.last_name 
                               ? `${instructorData.first_name} ${instructorData.last_name}` 
                               : instructorData?.username) ||
                             course.instructor_name || 
                             'Instructor'}
                          </h3>
                          {(instructorData?.cargo_rol || instructorData?.type_rol) && (
                            <p className="text-gray-600 dark:text-slate-300 text-lg mb-3">
                              {instructorData.cargo_rol || instructorData.type_rol}
                            </p>
                          )}
                          {instructorData?.location && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300 mb-4">
                              <span className="text-sm">{instructorData.location}</span>
                            </div>
                          )}
                          {/* Social Links */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {instructorData?.linkedin_url && (
                              <a
                                href={instructorData.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-600/30 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                <span className="text-sm font-medium">LinkedIn</span>
                              </a>
                            )}
                            {instructorData?.github_url && (
                              <a
                                href={instructorData.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700/20 hover:bg-gray-700/30 text-gray-300 rounded-lg border border-gray-600/30 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm font-medium">GitHub</span>
                              </a>
                            )}
                            {instructorData?.website_url && (
                              <a
                                href={instructorData.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg border border-primary/30 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <span className="text-sm font-medium">Portafolio</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      {course.instructor_email && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-600 dark:text-slate-300 text-sm mb-1">Correo electrónico</p>
                              <a
                                href={`mailto:${course.instructor_email}`}
                                className="text-primary hover:text-primary/80 transition-colors font-medium break-all"
                              >
                                {course.instructor_email}
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bio */}
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Biografía</h4>
                        {instructorData?.bio ? (
                          <p className="text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                            {instructorData.bio}
                          </p>
                        ) : (
                          <p className="text-gray-500 dark:text-slate-400 italic">No hay biografía disponible para este instructor.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Course Info Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 sticky top-6 shadow-sm dark:shadow-none">
            <div className="space-y-6">
              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  {course.price && course.price !== 'MX$0' ? (
                    <>
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {course.price}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary">Gratis</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isPurchased ? (
                  <button
                    onClick={() => router.push(`/courses/${slug}/learn`)}
                    className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Ir a Taller
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing || checkingPurchase}
                    className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : checkingPurchase ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Adquirir Curso
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Course Features */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Acceso de por vida</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">{totalLessons || '0'} lecciones en video</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Certificado de finalización</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-slate-200">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Actualizado {formatDate(course.updatedAt)}</span>
                </div>
              </div>

              {/* Rating Summary - Solo mostrar si hay rating o reseñas */}
              {((course.rating && course.rating > 0) || (course.review_count && course.review_count > 0)) ? (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <StarRating
                    rating={course.rating || 0}
                    size="lg"
                    showRatingNumber={!!(course.rating && course.rating > 0)}
                    reviewCount={course.review_count}
                    className="justify-center"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Modal de éxito personalizado */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={async () => {
          setShowSuccessModal(false);
          // Recargar el estado de compra después de cerrar el modal
          try {
            const checkPurchaseResponse = await fetch(`/api/courses/${slug}/check-purchase`);
            if (checkPurchaseResponse.ok) {
              const purchaseData = await checkPurchaseResponse.json();
              setIsPurchased(purchaseData.isPurchased || false);
            }
          } catch (checkError) {
            // Si falla, mantener el estado actual
          }
        }}
        title={successMessage}
        message="Ya puedes comenzar a aprender"
        duration={4000}
      />

      {/* Modal de error personalizado */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorMessage}
        message="Por favor, intenta de nuevo más tarde"
        duration={5000}
      />
    </motion.div>
  );
}
