'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, BookOpen, Route, Shield, CheckCircle2,
  Loader2, AlertTriangle, Plus, Trash2, Search,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import type {
  UserAssignment,
  AssignedCourse,
  OrganizationLearningPathAssignment,
  UserLearningPathAssignment,
} from '@/features/admin/components/courses-section/courses-section.types'

type Tab = 'info' | 'courses' | 'paths'

function getUserDisplayName(user?: CompanyMember['user']): string {
  if (!user) return 'Usuario'
  if (user.display_name) return user.display_name
  const parts = [user.first_name, user.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return user.email.split('@')[0]
}

interface AdminMemberDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  member: CompanyMember | null
  companyId: string
}

export function AdminMemberDetailModal({
  isOpen,
  onClose,
  onUpdate,
  member,
  companyId,
}: AdminMemberDetailModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [selectedRole, setSelectedRole] = useState<string>(member?.role ?? 'member')
  const [savingRole, setSavingRole] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userCourses, setUserCourses] = useState<UserAssignment[]>([])
  const [orgCourses, setOrgCourses] = useState<AssignedCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [courseSearch, setCourseSearch] = useState('')
  const [assigningCourseId, setAssigningCourseId] = useState<string | null>(null)
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null)

  const [userLPs, setUserLPs] = useState<UserLearningPathAssignment[]>([])
  const [orgLPs, setOrgLPs] = useState<OrganizationLearningPathAssignment[]>([])
  const [loadingLPs, setLoadingLPs] = useState(false)
  const [lpSearch, setLPSearch] = useState('')
  const [assigningLPId, setAssigningLPId] = useState<string | null>(null)
  const [removingLPId, setRemovingLPId] = useState<string | null>(null)

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role ?? 'member')
      setActiveTab('info')
      setError(null)
      setUserCourses([])
      setOrgCourses([])
      setUserLPs([])
      setOrgLPs([])
      setCourseSearch('')
      setLPSearch('')
    }
  }, [member?.user_id])

  const fetchCourses = useCallback(async () => {
    if (!member) return
    setLoadingCourses(true)
    setError(null)
    try {
      const [assignRes, orgRes] = await Promise.all([
        fetch(`/api/admin/companies/${companyId}/user-assignments`),
        fetch(`/api/admin/companies/${companyId}/courses`),
      ])
      const [assignData, orgData] = await Promise.all([
        assignRes.json() as Promise<{ success: boolean; assignments?: UserAssignment[] }>,
        orgRes.json() as Promise<{ success: boolean; courses?: AssignedCourse[] }>,
      ])
      if (assignData.success && assignData.assignments) {
        setUserCourses(assignData.assignments.filter(a => a.user_id === member.user_id))
      }
      if (orgData.success && orgData.courses) {
        setOrgCourses(orgData.courses)
      }
    } catch {
      setError('Error al cargar cursos')
    } finally {
      setLoadingCourses(false)
    }
  }, [companyId, member])

  const fetchLPs = useCallback(async () => {
    if (!member) return
    setLoadingLPs(true)
    setError(null)
    try {
      const [assignRes, orgRes] = await Promise.all([
        fetch(`/api/admin/companies/${companyId}/user-learning-path-assignments`),
        fetch(`/api/admin/companies/${companyId}/learning-paths`),
      ])
      const [assignData, orgData] = await Promise.all([
        assignRes.json() as Promise<{ success: boolean; assignments?: UserLearningPathAssignment[] }>,
        orgRes.json() as Promise<{ success: boolean; assignments?: OrganizationLearningPathAssignment[] }>,
      ])
      if (assignData.success && assignData.assignments) {
        setUserLPs(assignData.assignments.filter(a => a.user_id === member.user_id))
      }
      if (orgData.success && orgData.assignments) {
        setOrgLPs(orgData.assignments)
      }
    } catch {
      setError('Error al cargar rutas')
    } finally {
      setLoadingLPs(false)
    }
  }, [companyId, member])

  useEffect(() => {
    if (!isOpen || !member) return
    if (activeTab === 'courses') fetchCourses()
    if (activeTab === 'paths') fetchLPs()
  }, [isOpen, activeTab, fetchCourses, fetchLPs])

  const handleSaveRole = async () => {
    if (!member) return
    setSavingRole(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/members/${member.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
      const data = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error || t('users.manageModal.errorUpdate'))
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.manageModal.errorSave'))
    } finally {
      setSavingRole(false)
    }
  }

  const handleAssignCourse = async (courseId: string) => {
    if (!member) return
    setAssigningCourseId(courseId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/user-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.user_id, courseId }),
      })
      const data = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al asignar curso')
      await fetchCourses()
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar')
    } finally {
      setAssigningCourseId(null)
    }
  }

  const handleRemoveCourse = async (assignmentId: string) => {
    setRemovingCourseId(assignmentId)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/user-assignments?assignmentId=${assignmentId}`,
        { method: 'DELETE' },
      )
      const data = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al revocar')
      await fetchCourses()
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revocar')
    } finally {
      setRemovingCourseId(null)
    }
  }

  const handleAssignLP = async (learningPathId: string) => {
    if (!member) return
    setAssigningLPId(learningPathId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/user-learning-path-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.user_id, learningPathId }),
      })
      const data = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al asignar ruta')
      await fetchLPs()
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar')
    } finally {
      setAssigningLPId(null)
    }
  }

  const handleRemoveLP = async (assignmentId: string) => {
    setRemovingLPId(assignmentId)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/user-learning-path-assignments?assignmentId=${assignmentId}`,
        { method: 'DELETE' },
      )
      const data = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al revocar')
      await fetchLPs()
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revocar')
    } finally {
      setRemovingLPId(null)
    }
  }

  if (!isOpen || !member) return null

  const displayName = getUserDisplayName(member.user)

  const assignedCourseIds = new Set(userCourses.map(uc => uc.course_id))
  const availableCourses = orgCourses.filter(
    oc =>
      !assignedCourseIds.has(oc.course_id) &&
      (courseSearch === '' || oc.courses.title.toLowerCase().includes(courseSearch.toLowerCase())),
  )

  const assignedLPIds = new Set(userLPs.map(ul => ul.learning_path_id))
  const availableLPs = orgLPs.filter(
    ol =>
      !assignedLPIds.has(ol.learning_path_id) &&
      (lpSearch === '' || (ol.learning_path?.title ?? '').toLowerCase().includes(lpSearch.toLowerCase())),
  )

  const roleLabels = {
    member: { label: t('users.roles.member.label'), desc: t('users.roles.member.description') },
    admin: { label: t('users.roles.admin.label'), desc: t('users.roles.admin.description') },
    owner: { label: t('users.roles.owner.label'), desc: t('users.roles.owner.description') },
  }

  const tabs = [
    { id: 'info' as Tab, label: 'Información', Icon: User },
    { id: 'courses' as Tab, label: 'Cursos', Icon: BookOpen },
    { id: 'paths' as Tab, label: 'Rutas', Icon: Route },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl border bg-white dark:bg-carbon-800 border-gray-100 dark:border-white/10"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.user?.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-1">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-accent/10 text-accent'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Tab content */}
          <div className="max-h-[55vh] overflow-y-auto p-6">
            {/* ── Info tab ── */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {[member.user?.first_name, member.user?.last_name].filter(Boolean).join(' ') || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Username</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{member.user?.username || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</p>
                    <p className={`mt-1 text-sm font-medium ${member.status === 'active' ? 'text-green-600' : 'text-amber-500'}`}>
                      {member.status === 'active' ? 'Activo' : (member.status ?? '—')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha de ingreso</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-white/70">
                    {t('users.manageModal.changeRole')}
                  </label>
                  <div className="grid gap-2">
                    {(['member', 'admin', 'owner'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                          selectedRole === role
                            ? 'border-accent bg-accent/10'
                            : 'border-gray-100 bg-gray-50 hover:border-accent/40 dark:border-white/10 dark:bg-carbon-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Shield className={`h-4 w-4 ${selectedRole === role ? 'text-accent' : 'text-gray-400'}`} />
                          <div>
                            <p className={`text-sm font-bold ${selectedRole === role ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-white/80'}`}>
                              {roleLabels[role].label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[role].desc}</p>
                          </div>
                        </div>
                        {selectedRole === role && <CheckCircle2 className="h-4 w-4 text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Courses tab ── */}
            {activeTab === 'courses' && (
              <div className="space-y-5">
                {loadingCourses ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Cursos asignados ({userCourses.length})
                      </p>
                      {userCourses.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center dark:border-white/10">
                          <p className="text-sm text-gray-400">Sin cursos asignados</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {userCourses.map(uc => (
                            <div
                              key={uc.id}
                              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{uc.courses.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {uc.courses.category} · {uc.completion_percentage}% completado
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveCourse(uc.id)}
                                disabled={removingCourseId === uc.id}
                                className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {removingCourseId === uc.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Trash2 className="h-4 w-4" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Catálogo organizacional
                      </p>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar curso..."
                          value={courseSearch}
                          onChange={e => setCourseSearch(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-white/10 dark:bg-carbon-900 dark:text-white"
                        />
                      </div>
                      {availableCourses.length === 0 ? (
                        <p className="py-3 text-center text-sm text-gray-400">
                          {courseSearch ? 'Sin resultados' : 'Todos los cursos ya están asignados'}
                        </p>
                      ) : (
                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                          {availableCourses.map(oc => (
                            <div
                              key={oc.id}
                              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{oc.courses.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{oc.courses.category}</p>
                              </div>
                              <button
                                onClick={() => handleAssignCourse(oc.course_id)}
                                disabled={!!assigningCourseId}
                                className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                              >
                                {assigningCourseId === oc.course_id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Plus className="h-3 w-3" />}
                                Asignar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Learning Paths tab ── */}
            {activeTab === 'paths' && (
              <div className="space-y-5">
                {loadingLPs ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Rutas asignadas ({userLPs.length})
                      </p>
                      {userLPs.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-200 py-6 text-center dark:border-white/10">
                          <p className="text-sm text-gray-400">Sin rutas asignadas</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {userLPs.map(ul => (
                            <div
                              key={ul.id}
                              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                  {ul.learning_path?.title ?? 'Ruta sin título'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {ul.learning_path?.item_count ?? 0} cursos
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveLP(ul.id)}
                                disabled={removingLPId === ul.id}
                                className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {removingLPId === ul.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Trash2 className="h-4 w-4" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Rutas organizacionales disponibles
                      </p>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar ruta..."
                          value={lpSearch}
                          onChange={e => setLPSearch(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-white/10 dark:bg-carbon-900 dark:text-white"
                        />
                      </div>
                      {availableLPs.length === 0 ? (
                        <p className="py-3 text-center text-sm text-gray-400">
                          {lpSearch ? 'Sin resultados' : 'Todas las rutas ya están asignadas'}
                        </p>
                      ) : (
                        <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                          {availableLPs.map(ol => (
                            <div
                              key={ol.id}
                              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/5"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                  {ol.learning_path?.title ?? 'Ruta sin título'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {ol.learning_path?.item_count ?? 0} cursos
                                </p>
                              </div>
                              <button
                                onClick={() => handleAssignLP(ol.learning_path_id)}
                                disabled={!!assigningLPId}
                                className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                              >
                                {assigningLPId === ol.learning_path_id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <Plus className="h-3 w-3" />}
                                Asignar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-white/5">
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5"
            >
              {tc('actions.close')}
            </button>
            {activeTab === 'info' && (
              <button
                onClick={handleSaveRole}
                disabled={savingRole || selectedRole === (member.role ?? 'member')}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white transition-all hover:bg-accent/90 disabled:opacity-50"
              >
                {savingRole && <Loader2 className="h-4 w-4 animate-spin" />}
                {tc('actions.saveChanges')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
