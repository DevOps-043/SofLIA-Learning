'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  UserCircleIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAdminWorkshops } from '../hooks/useAdminWorkshops'
import { AdminWorkshop } from '../services/adminWorkshops.service'
import { EditWorkshopModal } from './EditWorkshopModal'
import { AddWorkshopModal } from './AddWorkshopModal'
import { DeleteWorkshopModal } from './DeleteWorkshopModal'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
}

// Componente interno para manejar la imagen del taller con fallback
function WorkshopThumbnail({ thumbnailUrl, title }: { thumbnailUrl?: string; title: string }) {
  const [imageError, setImageError] = useState(false)

  if (!thumbnailUrl || imageError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#00D4B3]/30 to-[#0A2540] dark:from-[#0A2540] dark:via-[#00D4B3]/20 dark:to-[#0A2540]"
      >
        {/* Patrón de fondo animado */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #00D4B3 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10"
        >
          <div className="p-6 bg-white/10 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
            <BookOpenIcon className="h-24 w-24 text-[#00D4B3] dark:text-[#00D4B3]/60" />
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.15 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onError={() => setImageError(true)}
      />
      {/* Overlay sutil siempre visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
      {/* Efecto de brillo en hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
        animate={{
          x: ['-100%', '200%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

export function AdminWorkshopsPage() {
  const router = useRouter()
  const { workshops, stats, isLoading, error, refetch } = useAdminWorkshops()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingWorkshop, setEditingWorkshop] = useState<AdminWorkshop | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [workshopToDelete, setWorkshopToDelete] = useState<AdminWorkshop | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filteredWorkshops = workshops.filter(workshop => {
    // Excluir estados que pertenecen a revisiones (pending, rejected)
    if (workshop.approval_status === 'pending' || workshop.approval_status === 'rejected') {
      return false
    }

    const matchesSearch = workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workshop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workshop.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filterCategory === 'all' || workshop.category === filterCategory
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && workshop.is_active) ||
      (filterStatus === 'inactive' && !workshop.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
      case 'Principiante':
        return {
          bg: 'bg-[#10B981]/10 dark:bg-[#10B981]/20',
          text: 'text-[#10B981]',
          border: 'border-[#10B981]/20'
        }
      case 'intermediate':
      case 'Intermedio':
        return {
          bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
          text: 'text-[#F59E0B]',
          border: 'border-[#F59E0B]/20'
        }
      case 'advanced':
      case 'Avanzado':
        return {
          bg: 'bg-[#EF4444]/10 dark:bg-[#EF4444]/20',
          text: 'text-[#EF4444]',
          border: 'border-[#EF4444]/20'
        }
      default:
        return {
          bg: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20',
          text: 'text-[#6C757D]',
          border: 'border-[#6C757D]/20'
        }
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Frontend':
      case 'frontend':
        return {
          bg: 'bg-[#0A2540]/10 dark:bg-[#0A2540]/30',
          text: 'text-[#0A2540] dark:text-[#00D4B3]',
          border: 'border-[#0A2540]/20 dark:border-[#00D4B3]/30'
        }
      case 'Backend':
      case 'backend':
        return {
          bg: 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20',
          text: 'text-[#00D4B3]',
          border: 'border-[#00D4B3]/20'
        }
      case 'Diseño':
      case 'diseño':
      case 'design':
        return {
          bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
          text: 'text-[#F59E0B]',
          border: 'border-[#F59E0B]/20'
        }
      case 'ia':
      case 'Inteligencia Artificial':
        return {
          bg: 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20',
          text: 'text-[#00D4B3]',
          border: 'border-[#00D4B3]/20'
        }
      default:
        return {
          bg: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20',
          text: 'text-[#6C757D]',
          border: 'border-[#6C757D]/20'
        }
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return level
    }
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#E9ECEF] dark:bg-[#1E2329] rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-xl"></div>
            ))}
          </div>
          <div className="h-12 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XMarkIcon className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 mb-1">
                Error al cargar los talleres
              </h3>
              <p className="text-xs text-red-500/80 dark:text-red-400/80">{error}</p>
              <button
                onClick={refetch}
                className="mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#F8FAFC] dark:bg-transparent min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
                Gestión de Talleres
              </h1>
              <p className="text-[#6C757D] dark:text-white/60">
                Administra todos los talleres de la plataforma
              </p>
            </div>
            <motion.button
              onClick={() => setIsAddModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-[#0A2540]/20"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Crear Taller</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <motion.div variants={itemVariants} className="p-4 bg-white dark:bg-gradient-to-br dark:from-[#0A2540] dark:to-[#0A2540]/60 rounded-xl border border-[#E9ECEF] dark:border-[#0A2540]/20 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-lg">
                <BookOpenIcon className="h-5 w-5 text-[#00D4B3]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6C757D] dark:text-white/70 uppercase tracking-wide">Total Talleres</p>
                <p className="text-2xl font-bold text-[#0A2540] dark:text-white">{stats?.totalWorkshops || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-4 bg-white dark:bg-gradient-to-br dark:from-[#10B981]/20 dark:to-[#10B981]/10 rounded-xl border border-[#E9ECEF] dark:border-[#10B981]/20 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#10B981]/10 dark:bg-[#10B981]/20 rounded-lg">
                <PlayIcon className="h-5 w-5 text-[#10B981] dark:text-[#10B981]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6C757D] dark:text-[#10B981] uppercase tracking-wide">Activos</p>
                <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
                  {stats?.activeWorkshops || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-4 bg-white dark:bg-gradient-to-br dark:from-[#00D4B3]/20 dark:to-[#00D4B3]/10 rounded-xl border border-[#E9ECEF] dark:border-[#00D4B3]/20 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-lg">
                <UserCircleIcon className="h-5 w-5 text-[#00D4B3]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6C757D] dark:text-[#00D4B3] uppercase tracking-wide">Total Estudiantes</p>
                <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
                  {stats?.totalStudents || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-4 bg-white dark:bg-gradient-to-br dark:from-[#F59E0B]/20 dark:to-[#F59E0B]/10 rounded-xl border border-[#E9ECEF] dark:border-[#F59E0B]/20 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 rounded-lg">
                <ClockIcon className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#6C757D] dark:text-[#F59E0B] uppercase tracking-wide">Duración Promedio</p>
                <p className="text-2xl font-bold text-[#0A2540] dark:text-white">
                  {stats?.averageDuration || 0} min
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D] dark:text-white/60" />
              <input
                type="text"
                placeholder="Buscar talleres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-[#6C757D] dark:text-white/60" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 text-sm"
              >
                <option value="all">Todas las categorías</option>
                <option value="ia">Inteligencia Artificial</option>
                <option value="tecnologia">Tecnología</option>
                <option value="negocios">Negocios</option>
                <option value="diseño">Diseño</option>
                <option value="marketing">Marketing</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div >
          </div >
        </motion.div >

        {/* Workshops Grid */}
        {
          filteredWorkshops.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-12"
            >
              <div className="flex flex-col items-center justify-center">
                <BookOpenIcon className="h-16 w-16 text-[#6C757D] dark:text-white/30 mb-4" />
                <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-2">
                  No se encontraron talleres
                </h3>
                <p className="text-sm text-[#6C757D] dark:text-white/60 text-center">
                  {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay talleres creados en el sistema'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredWorkshops.map((workshop, index) => {
                const levelColors = getLevelColor(workshop.level)
                const categoryColors = getCategoryColor(workshop.category)

                // Obtener iniciales del instructor para el fallback
                const getInstructorInitials = () => {
                  if (!workshop.instructor_name || workshop.instructor_name === 'Sin instructor') return 'SI'
                  const names = workshop.instructor_name.split(' ')
                  if (names.length >= 2) {
                    return `${names[0][0]}${names[1][0]}`.toUpperCase()
                  }
                  return workshop.instructor_name.substring(0, 2).toUpperCase()
                }

                return (
                  <motion.div
                    key={workshop.id}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    {/* Thumbnail con overlay mejorado */}
                    <div className="h-56 bg-gradient-to-br from-[#0A2540]/10 to-[#00D4B3]/10 dark:from-[#0A0D12] dark:to-[#0A2540]/20 relative overflow-hidden flex-shrink-0 group/image">
                      <WorkshopThumbnail thumbnailUrl={workshop.thumbnail_url} title={workshop.title} />
                      {/* Overlay gradient mejorado */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      {/* Borde brillante en hover */}
                      <div className="absolute inset-0 border-2 border-[#00D4B3]/0 group-hover:border-[#00D4B3]/50 transition-all duration-500 rounded-t-2xl pointer-events-none" />
                      {/* Status badge mejorado */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                        className="absolute top-4 right-4 z-10"
                      >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-xl ${workshop.is_active
                          ? 'bg-[#10B981]/95 dark:bg-[#10B981]/40 text-white dark:text-[#10B981] border-[#10B981]/50 shadow-[#10B981]/30'
                          : 'bg-[#6C757D]/95 dark:bg-[#6C757D]/40 text-white dark:text-[#6C757D] border-[#6C757D]/50 shadow-[#6C757D]/30'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${workshop.is_active ? 'bg-white animate-pulse' : 'bg-white/70'}`}></div>
                          {workshop.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </motion.div>
                      {/* Tags sobre la imagen mejorados */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 z-10">
                        <motion.span
                          initial={{ x: -30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.1, type: 'spring' }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-lg ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border}`}
                        >
                          {workshop.category}
                        </motion.span>
                        <motion.span
                          initial={{ x: -30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.15, type: 'spring' }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-lg ${levelColors.bg} ${levelColors.text} ${levelColors.border}`}
                        >
                          {getLevelLabel(workshop.level)}
                        </motion.span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Title */}
                      <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className="text-xl font-bold text-[#0A2540] dark:text-white mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-[#00D4B3] transition-colors duration-300"
                      >
                        {workshop.title}
                      </motion.h3>

                      {/* Description */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.25 }}
                        className="text-sm text-[#6C757D] dark:text-white/60 mb-5 line-clamp-2 flex-1 min-h-[2.5rem] leading-relaxed"
                      >
                        {workshop.description}
                      </motion.p>

                      {/* Instructor con foto */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                        className="flex items-center justify-between mb-5"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {workshop.instructor_profile_picture_url ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#00D4B3]/20 dark:ring-[#00D4B3]/30 flex-shrink-0">
                              <img
                                src={workshop.instructor_profile_picture_url}
                                alt={workshop.instructor_name || 'Instructor'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-[#00D4B3] to-[#0A2540] flex items-center justify-center text-white text-xs font-bold">${getInstructorInitials()}</div>`
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4B3] to-[#0A2540] flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#00D4B3]/20 dark:ring-[#00D4B3]/30 flex-shrink-0">
                              {getInstructorInitials()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#6C757D] dark:text-white/50 uppercase tracking-wide mb-0.5">Instructor</p>
                            <p className="text-sm font-semibold text-[#0A2540] dark:text-white truncate">
                              {workshop.instructor_name || 'Sin instructor'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0 px-3 py-1.5 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-lg">
                          <ClockIcon className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
                          <span className="text-sm font-medium text-[#0A2540] dark:text-white">{formatDuration(workshop.duration_total_minutes)}</span>
                        </div>
                      </motion.div>

                      {/* Footer with students count and actions mejorado */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 + 0.35 }}
                        className="flex items-center justify-between pt-5 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 mt-auto"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-lg"
                        >
                          <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-pulse"></div>
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00D4B3] animate-ping opacity-75"></div>
                          </div>
                          <span className="text-sm font-semibold text-[#0A2540] dark:text-white">
                            {workshop.student_count || 0} <span className="text-xs font-normal text-[#6C757D] dark:text-white/60">estudiantes</span>
                          </span>
                        </motion.div>
                        <div className="flex items-center gap-2 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] p-1.5 rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/20">
                          <motion.button
                            whileHover={{ scale: 1.2, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/workshops/${workshop.id}`)
                            }}
                            className="relative p-2.5 text-[#6C757D] dark:text-white/60 hover:text-white hover:bg-[#00D4B3] rounded-lg transition-all duration-300 group/btn"
                            title="Ver detalle"
                          >
                            <EyeIcon className="h-4 w-4 relative z-10" />
                            <motion.div
                              className="absolute inset-0 bg-[#00D4B3] rounded-lg opacity-0 group-hover/btn:opacity-100"
                              transition={{ duration: 0.2 }}
                            />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingWorkshop(workshop)
                            }}
                            className="relative p-2.5 text-[#6C757D] dark:text-white/60 hover:text-white hover:bg-[#10B981] rounded-lg transition-all duration-300 group/btn"
                            title="Editar taller"
                          >
                            <PencilIcon className="h-4 w-4 relative z-10" />
                            <motion.div
                              className="absolute inset-0 bg-[#10B981] rounded-lg opacity-0 group-hover/btn:opacity-100"
                              transition={{ duration: 0.2 }}
                            />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setWorkshopToDelete(workshop)
                            }}
                            className="relative p-2.5 text-[#6C757D] dark:text-white/60 hover:text-white hover:bg-[#EF4444] rounded-lg transition-all duration-300 group/btn"
                            title="Eliminar taller"
                            type="button"
                          >
                            <TrashIcon className="h-4 w-4 relative z-10" />
                            <motion.div
                              className="absolute inset-0 bg-[#EF4444] rounded-lg opacity-0 group-hover/btn:opacity-100"
                              transition={{ duration: 0.2 }}
                            />
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )
        }
      </div >

      {/* Modal de Creación */}
      {
        isAddModalOpen && (
          <AddWorkshopModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={async () => {
              await refetch()
            }}
          />
        )
      }

      {/* Modal de Edición */}
      {
        editingWorkshop && (
          <EditWorkshopModal
            workshop={editingWorkshop}
            onClose={() => setEditingWorkshop(null)}
            onSave={async (data) => {
              try {
                setIsUpdating(true)
                const response = await fetch(`/api/admin/workshops/${editingWorkshop.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Error al actualizar el taller')
                }

                await refetch()
                setEditingWorkshop(null)
              } catch (error) {
                alert(error instanceof Error ? error.message : 'Error al actualizar el taller')
              } finally {
                setIsUpdating(false)
              }
            }}
          />
        )
      }

      {/* Modal de Eliminación */}
      {
        workshopToDelete && (
          <DeleteWorkshopModal
            isOpen={true}
            onClose={() => {
              setWorkshopToDelete(null)
            }}
            workshop={workshopToDelete}
            onConfirm={async () => {
              if (!workshopToDelete) return

              try {
                const response = await fetch(`/api/admin/workshops/${workshopToDelete.id}`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' }
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Error al eliminar el taller')
                }

                await refetch()
                setWorkshopToDelete(null)
              } catch (error) {
                alert(error instanceof Error ? error.message : 'Error al eliminar el taller')
                throw error
              }
            }}
          />
        )
      }
    </div >
  )
}
