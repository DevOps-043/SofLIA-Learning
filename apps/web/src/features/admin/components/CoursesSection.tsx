'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Trash2, 
  BookOpen, 
  Clock, 
  Filter,
  AlertCircle,
  ExternalLink,
  X,
  CheckCircle,
  ChevronDown,
  Users,
  Building,
  GraduationCap,
  ChevronRight
} from 'lucide-react'
import { ToastNotification, type ToastType } from '@/core/components/ToastNotification/ToastNotification'

// ============================================
// DESIGN SYSTEM - CONSISTENT WITH ADMIN PANEL
// ============================================
const colors = {
    primary: '#0A2540',
    accent: '#00D4B3',
    bgPrimary: '#0A0D12',
    bgSecondary: '#1E2329',
    bgTertiary: '#0F1419',
    grayMedium: '#8899A6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899'
}

interface Course {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  category: string
  level: string
  instructor_name?: string
  is_active: boolean
  approval_status?: string
}

interface AssignedCourse {
  id: string
  course_id: string
  assigned_at: string
  status: string
  courses: Course
}

interface UserAssignment {
    id: string
    user_id: string
    course_id: string
    assigned_at: string
    status: string
    completion_percentage: number
    courses: Course
    users: {
        id: string
        email: string
        display_name: string | null
        first_name: string | null
        last_name: string | null
    }
}

interface CompanyMember {
    id: string
    user_id: string
    user: {
        id: string
        email: string
        display_name: string | null
        first_name: string | null
        last_name: string | null
    }
}

interface CoursesSectionProps {
  companyId: string
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ companyId }) => {
  // Tabs: 'org' | 'users'
  const [activeTab, setActiveTab] = useState<'org' | 'users'>('org')
  
  // Data state
  const [hierarchyCourses, setHierarchyCourses] = useState<AssignedCourse[]>([])
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [members, setMembers] = useState<CompanyMember[]>([])
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  
  // Filters & Search
  const [catalogSearch, setCatalogSearch] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [selectedCourseForUser, setSelectedCourseForUser] = useState<string | null>(null)
  const [selectedUserForCourse, setSelectedUserForCourse] = useState<string | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success'
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }

  useEffect(() => {
    fetchInitialData()
  }, [companyId])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Hierarchy Courses
      const hRes = await fetch(`/api/admin/companies/${companyId}/courses`)
      const hData = await hRes.json()
      if (hData.success) setHierarchyCourses(hData.courses)

      // 2. User Assignments
      const uRes = await fetch(`/api/admin/companies/${companyId}/user-assignments`)
      const uData = await uRes.json()
      if (uData.success) setUserAssignments(uData.assignments)

      // 3. All Courses (Catalog)
      const cRes = await fetch('/api/admin/courses')
      const cData = await cRes.json()
      if (cData.success) {
          // FILTER: Only active and approved
          const approvedCourses = (cData.courses as Course[]).filter((course) => 
            course.is_active === true && (course.approval_status === 'approved' || !course.approval_status)
          )
          setAllCourses(approvedCourses)
      }

      // 4. Company Members (for individual assignment)
      const mRes = await fetch(`/api/admin/companies/${companyId}`)
      const mData = await mRes.json()
      if (mData.success && mData.company) {
          setMembers(mData.company.members || [])
      }
    } catch (error) {
      console.error('Error fetching courses data:', error)
      showToast('Error al cargar la información', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Administrative actions
  const handleAssignToOrg = async (courseId: string) => {
    setAssigningId(courseId)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Curso adquirido satisfactoriamente')
        fetchInitialData()
        setIsCatalogOpen(false)
      } else {
        showToast(data.error || 'Error al adquirir el curso', 'error')
      }
    } catch (error) {
      showToast('Error de red', 'error')
    } finally {
      setAssigningId(null)
    }
  }

  const handleAssignToUser = async () => {
      if (!selectedCourseForUser || !selectedUserForCourse) {
          showToast('Selecciona usuario y curso', 'error')
          return
      }
      setIsAssigning(true)
      try {
        const res = await fetch(`/api/admin/companies/${companyId}/user-assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              userId: selectedUserForCourse, 
              courseId: selectedCourseForUser 
          })
        })
        const data = await res.json()
        if (data.success) {
          showToast('Curso asignado al usuario')
          fetchInitialData()
          setIsAssignUserModalOpen(false)
        } else {
          showToast(data.error || 'Error al asignar', 'error')
        }
      } catch (error) {
        showToast('Error de red', 'error')
      } finally {
        setIsAssigning(false)
      }
  }

  const handleRemoveHierarchy = async (courseId: string) => {
    if (!confirm('¿Revocar el acceso a este curso para TODA la organización?')) return
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/courses?courseId=${courseId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('Acceso organizacional revocado')
        fetchInitialData()
      }
    } catch (error) {
      showToast('Error al revocar', 'error')
    }
  }

  const handleRemoveUserAssignment = async (assignmentId: string) => {
    if (!confirm('¿Revocar esta asignación individual?')) return
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/user-assignments?assignmentId=${assignmentId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('Asignación individual revocada')
        fetchInitialData()
      }
    } catch (error) {
      showToast('Error al revocar', 'error')
    }
  }

  // Computed
  const filteredCatalog = allCourses.filter(c => 
    c.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  const activeHierarchy = hierarchyCourses.filter(ac => 
    ac.courses.title.toLowerCase().includes(listSearch.toLowerCase())
  )

  const activeUserAssignments = userAssignments.filter(ua => 
    ua.courses.title.toLowerCase().includes(listSearch.toLowerCase()) ||
    ua.users.email.toLowerCase().includes(listSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full" style={{ borderColor: `${colors.accent}20`, borderTopColor: colors.accent }} />
        <p className="text-sm font-medium" style={{ color: colors.grayMedium }}>Preparando catálogo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastNotification 
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        message={toast.message}
        type={toast.type}
      />

      {/* Tabs Selector */}
      <div className="flex p-1 rounded-2xl w-fit" style={{ backgroundColor: colors.bgTertiary }}>
          <button 
            onClick={() => setActiveTab('org')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'org' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Building className="w-4 h-4" />
            Acceso Organizacional
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Users className="w-4 h-4" />
            Asignaciones Individuales
          </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {activeTab === 'org' ? 'Cursos de la Organización' : 'Asignaciones Mensuales'}
          </h3>
          <p className="text-sm" style={{ color: colors.grayMedium }}>
            {activeTab === 'org' 
                ? 'Gestiona el catálogo general disponible para todos los miembros.' 
                : 'Asigna cursos específicos a usuarios seleccionados.'}
          </p>
        </div>
        
        <div className="flex gap-3">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCatalogOpen(true)}
                className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: colors.accent, color: colors.primary }}
            >
                <Plus className="w-5 h-5" />
                Adquirir Curso
            </motion.button>
            {activeTab === 'users' && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAssignUserModalOpen(true)}
                    className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border"
                    style={{ borderColor: colors.accent, color: colors.accent, backgroundColor: `${colors.accent}10` }}
                >
                    <GraduationCap className="w-5 h-5" />
                    Asignar a Usuario
                </motion.button>
            )}
        </div>
      </div>

      <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.grayMedium }} />
          <input 
            placeholder={activeTab === 'org' ? "Buscar en catálogo adquirido..." : "Buscar por usuario o curso..."}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm text-white focus:outline-none transition-all shadow-sm"
            style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
      </div>

      {activeTab === 'org' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeHierarchy.length === 0 ? (
                  <div className="col-span-full py-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <Building className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-sm text-center px-10" style={{ color: colors.grayMedium }}>No hay cursos adquiridos para toda la organización.<br/>Abre el catálogo para empezar.</p>
                  </div>
              ) : (
                activeHierarchy.map(ah => (
                    <CourseCard key={ah.id} course={ah.courses} date={ah.assigned_at} onRemove={() => handleRemoveHierarchy(ah.course_id)} />
                ))
              )}
          </div>
      ) : (
          <div className="overflow-hidden rounded-3xl border" style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}>
              <table className="w-full text-left">
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <tr>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.grayMedium }}>Usuario</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.grayMedium }}>Curso</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: colors.grayMedium }}>Progreso</th>
                          <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right" style={{ color: colors.grayMedium }}>Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {activeUserAssignments.length === 0 ? (
                           <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-sm" style={{ color: colors.grayMedium }}>No hay asignaciones individuales registradas.</td>
                           </tr>
                      ) : (
                        activeUserAssignments.map(ua => (
                            <tr key={ua.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                                            {ua.users.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{ua.users.display_name || `${ua.users.first_name || ''} ${ua.users.last_name || ''}`.trim()}</p>
                                            <p className="text-[10px]" style={{ color: colors.grayMedium }}>{ua.users.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-white line-clamp-1">{ua.courses.title}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent" style={{ width: `${ua.completion_percentage}%`, backgroundColor: colors.accent }} />
                                        </div>
                                        <span className="text-[10px] font-bold" style={{ color: colors.accent }}>{ua.completion_percentage}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleRemoveUserAssignment(ua.id)}
                                        className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 opacity-40 hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                      )}
                  </tbody>
              </table>
          </div>
      )}

      {/* CATALOG MODAL (Redesigned with Grid) */}
      <AnimatePresence>
          {isCatalogOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsCatalogOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                  
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="relative w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col"
                    style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
                    
                    {/* Catalog Header */}
                    <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Catálogo Global</h4>
                                <p className="text-sm" style={{ color: colors.grayMedium }}>Selecciona cursos para adquirir de forma organizacional.</p>
                            </div>
                            <button onClick={() => setIsCatalogOpen(false)} className="p-3 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.grayMedium }} />
                            <input 
                                autoFocus
                                placeholder="Busca por título, categoría o nivel..."
                                className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-0 text-white focus:outline-none focus:ring-2 transition-all shadow-inner"
                                style={{ backgroundColor: colors.bgTertiary }}
                                value={catalogSearch}
                                onChange={(e) => setCatalogSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Catalog Grid */}
                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        {filteredCatalog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <BookOpen className="w-16 h-16 mb-4 opacity-5" />
                                <p className="text-lg font-bold text-white/20">No se encontraron cursos</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCatalog.map(course => {
                                    const isAlreadyPurchased = hierarchyCourses.some(hc => hc.course_id === course.id)
                                    return (
                                        <motion.div 
                                            key={course.id}
                                            whileHover={{ y: -5 }}
                                            className="group rounded-3xl overflow-hidden border transition-all flex flex-col"
                                            style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
                                        >
                                            <div className="aspect-video relative overflow-hidden bg-black/40">
                                                {course.thumbnail_url ? (
                                                    <img src={course.thumbnail_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-10"><BookOpen className="w-10 h-10" /></div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                                <div className="absolute top-4 left-4">
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-white border border-white/10">
                                                        {course.level}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{course.category}</p>
                                                <h5 className="text-lg font-bold text-white leading-tight mb-6 line-clamp-2">{course.title}</h5>
                                                
                                                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                                    {isAlreadyPurchased ? (
                                                        <div className="flex items-center gap-2 text-success">
                                                            <CheckCircle className="w-4 h-4" />
                                                            <span className="text-xs font-bold uppercase">Ya adquirido</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            disabled={!!assigningId}
                                                            onClick={() => handleAssignToOrg(course.id)}
                                                            className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                                            style={{ backgroundColor: colors.accent, color: colors.primary }}
                                                        >
                                                            {assigningId === course.id ? 'Procesando...' : 'Adquirir ahora'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* INDIVIDUAL ASSIGNMENT MODAL */}
      <AnimatePresence>
          {isAssignUserModalOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsAssignUserModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                  
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border"
                    style={{ backgroundColor: colors.bgSecondary, borderColor: 'rgba(255,255,255,0.1)' }}>
                    
                    <div className="p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Asignar a Usuario</h4>
                        <p className="text-sm" style={{ color: colors.grayMedium }}>Asigna un curso específico del catálogo de la organización.</p>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Selector de Usuario */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>Seleccionar Miembro</label>
                            <div className="relative group">
                                <select 
                                    className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
                                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                                    value={selectedUserForCourse || ''}
                                    onChange={(e) => setSelectedUserForCourse(e.target.value)}
                                >
                                    <option value="">Buscar miembro...</option>
                                    {members.map(m => (
                                        <option key={m.user_id} value={m.user_id}>
                                            {m.user.display_name || m.user.email}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                            </div>
                        </div>

                        {/* Selector de Curso */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.grayMedium }}>Seleccionar Curso</label>
                            <div className="relative group">
                                <select 
                                    className="w-full h-14 pl-5 pr-10 rounded-2xl bg-black/20 border-white/5 border text-white text-sm appearance-none outline-none focus:ring-2"
                                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                                    value={selectedCourseForUser || ''}
                                    onChange={(e) => setSelectedCourseForUser(e.target.value)}
                                >
                                    <option value="">Buscar curso...</option>
                                    {allCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setIsAssignUserModalOpen(false)} className="flex-1 py-4 text-sm font-bold text-white/40 hover:text-white transition-all">Cancelar</button>
                        <button 
                            disabled={!selectedUserForCourse || !selectedCourseForUser || isAssigning}
                            onClick={handleAssignToUser}
                            className="flex-[2] py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-xl"
                            style={{ backgroundColor: colors.accent, color: colors.primary }}
                        >
                            {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
                        </button>
                    </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  )
}

// Sub-component for Hierarchy Course Cards
function CourseCard({ course, date, onRemove }: { course: Course, date: string, onRemove: () => void }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-[2rem] overflow-hidden border transition-all hover:shadow-2xl hover:shadow-accent/5 flex flex-col h-full"
            style={{ backgroundColor: colors.bgTertiary, borderColor: 'rgba(255,255,255,0.05)' }}
        >
            <div className="aspect-video relative overflow-hidden bg-black/20">
                {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" alt="" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10"><BookOpen className="w-10 h-10" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 right-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10">{course.level}</span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: colors.accent }}>{course.category}</p>
                <h5 className="text-base font-bold text-white leading-tight line-clamp-2 mb-4">{course.title}</h5>
                
                <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" style={{ color: colors.grayMedium }} />
                            <span className="text-[11px] font-medium" style={{ color: colors.grayMedium }}>Adquirido: {new Date(date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button 
                        onClick={onRemove}
                        className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all opacity-40 hover:opacity-100"
                    >
                        Revocar Acceso
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
