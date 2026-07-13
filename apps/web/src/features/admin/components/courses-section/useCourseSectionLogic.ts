'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import {
  AdminContentDefaultsService,
  type AdminContentDefaultRule,
  type AdminHierarchyNode,
} from '@/features/admin/services/adminContentDefaults.service'
import type { ContentDefaultTarget } from './ContentDefaultModal'
import type {
  Course,
  AssignedCourse,
  UserAssignment,
  CompanyMember,
  LearningPath,
  OrganizationLearningPathAssignment,
  UserLearningPathAssignment,
  UnifiedOrgItem,
  UnifiedUserItem,
} from './courses-section.types'

interface UseCourseSectionLogicProps {
  companyId: string
}

/**
 * Case- and accent-insensitive normalization so searches like "lideres"
 * match titles like "Líderes" (Spanish content is the common case).
 */
function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchesSearch(query: string, ...fields: Array<string | null | undefined>): boolean {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (!normalizedQuery) return true
  return fields.some(field => field != null && normalizeSearchText(field).includes(normalizedQuery))
}

export function useCourseSectionLogic({ companyId }: UseCourseSectionLogicProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<'org' | 'users'>('org')

  // Data state
  const [hierarchyCourses, setHierarchyCourses] = useState<AssignedCourse[]>([])
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [organizationLearningPaths, setOrganizationLearningPaths] = useState<OrganizationLearningPathAssignment[]>([])
  const [userLearningPathAssignments, setUserLearningPathAssignments] = useState<UserLearningPathAssignment[]>([])
  const [allLearningPaths, setAllLearningPaths] = useState<LearningPath[]>([])
  const [members, setMembers] = useState<CompanyMember[]>([])

  // Default-content rules (auto-assign by organization / hierarchy node)
  const [courseDefaultRules, setCourseDefaultRules] = useState<AdminContentDefaultRule[]>([])
  const [learningPathDefaultRules, setLearningPathDefaultRules] = useState<AdminContentDefaultRule[]>([])
  const [hierarchyNodes, setHierarchyNodes] = useState<AdminHierarchyNode[]>([])
  const [defaultModalTarget, setDefaultModalTarget] = useState<ContentDefaultTarget | null>(null)

  // UI State
  const [loading, setLoading] = useState(true)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isLearningPathCatalogOpen, setIsLearningPathCatalogOpen] = useState(false)
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false)
  const [isAssignLearningPathModalOpen, setIsAssignLearningPathModalOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)

  // Content type filter (unified panel)
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'courses' | 'paths'>('all')

  // Filters & Search
  const [catalogSearch, setCatalogSearch] = useState('')
  const [learningPathCatalogSearch, setLearningPathCatalogSearch] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [selectedCourseForUser, setSelectedCourseForUser] = useState<string | null>(null)
  const [selectedUserForCourse, setSelectedUserForCourse] = useState<string | null>(null)
  const [selectedLearningPathForUser, setSelectedLearningPathForUser] = useState<string | null>(null)
  const [selectedUserForLearningPath, setSelectedUserForLearningPath] = useState<string | null>(null)

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

    // Un solo request agregado en lugar de 9 GETs paralelos: cada request
    // extra pagaba middleware + auth + invocación serverless por separado y
    // bajo concurrencia provocaba cold starts de ~18 s. El servidor resuelve
    // todas las secciones compartiendo queries (ver courses-section route) y
    // reporta en failedSections las que fallaron (fail-soft por sección).
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/courses-section`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Error al cargar la información de cursos')
      }

      setHierarchyCourses(data.companyCourses || [])
      setUserAssignments(data.userCourseAssignments || [])

      const approvedCourses = ((data.catalogCourses || []) as Course[]).filter((course) =>
        course.is_active === true && (course.approval_status === 'approved' || !course.approval_status)
      )
      setAllCourses(approvedCourses)

      setAllLearningPaths(((data.learningPaths || []) as LearningPath[]).filter((path) => path.is_active))
      setOrganizationLearningPaths(data.organizationLearningPathAssignments || [])
      setUserLearningPathAssignments(data.userLearningPathAssignments || [])
      setMembers(data.members || [])
      setCourseDefaultRules(data.courseDefaults?.rules || [])
      setHierarchyNodes(data.courseDefaults?.nodes || [])
      setLearningPathDefaultRules(data.learningPathDefaults?.rules || [])

      if ((data.failedSections || []).length > 0) {
        techDebtLogger.error('Courses section loaded with failed sections:', data.failedSections)
        showToast('Error al cargar parte de la información', 'error')
      }
    } catch (error) {
      techDebtLogger.error('Error fetching courses section data:', error)
      showToast('Error al cargar la información de cursos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const refetchDefaults = useCallback(async () => {
    try {
      const [courseDefaults, lpDefaults] = await Promise.all([
        AdminContentDefaultsService.getCourseDefaults(companyId),
        AdminContentDefaultsService.getLearningPathDefaults(companyId),
      ])
      setCourseDefaultRules(courseDefaults.rules)
      setHierarchyNodes(courseDefaults.nodes)
      setLearningPathDefaultRules(lpDefaults.rules)
    } catch (error) {
      techDebtLogger.error('Error refetching default rules:', error)
    }
  }, [companyId])

  const openDefaultModal = (target: ContentDefaultTarget) => setDefaultModalTarget(target)
  const closeDefaultModal = () => setDefaultModalTarget(null)

  const handleDefaultChanged = useCallback(
    async (message?: string, type: ToastType = 'success') => {
      if (message) showToast(message, type)
      await refetchDefaults()
    },
    [refetchDefaults],
  )

  const handleAssignLearningPathToOrg = async (learningPathId: string) => {
    setAssigningId(learningPathId)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/learning-paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningPathId })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Learning path asignado a la organización')
        fetchInitialData()
        setIsLearningPathCatalogOpen(false)
      } else {
        showToast(data.error || 'Error al asignar learning path', 'error')
      }
    } catch (error) {
      showToast('Error de red', 'error')
    } finally {
      setAssigningId(null)
    }
  }

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

  const handleAssignLearningPathToUser = async () => {
    if (!selectedLearningPathForUser || !selectedUserForLearningPath) {
      showToast('Selecciona usuario y learning path', 'error')
      return
    }

    setIsAssigning(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/user-learning-path-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForLearningPath,
          learningPathId: selectedLearningPathForUser
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast('Learning path asignado al usuario')
        fetchInitialData()
        setIsAssignLearningPathModalOpen(false)
      } else {
        showToast(data.error || 'Error al asignar learning path', 'error')
      }
    } catch (error) {
      showToast('Error de red', 'error')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveHierarchy = async (courseId: string) => {
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

  const handleRemoveOrganizationLearningPath = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/learning-paths?assignmentId=${assignmentId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showToast('Learning path organizacional revocado')
        fetchInitialData()
      }
    } catch (error) {
      showToast('Error al revocar', 'error')
    }
  }

  const handleRemoveUserLearningPathAssignment = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/user-learning-path-assignments?assignmentId=${assignmentId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        showToast('Asignación individual de learning path revocada')
        fetchInitialData()
      }
    } catch (error) {
      showToast('Error al revocar', 'error')
    }
  }

  const filteredCatalog = useMemo(() => allCourses.filter(c =>
    matchesSearch(catalogSearch, c.title, c.category)
  ), [allCourses, catalogSearch])

  const filteredLearningPathCatalog = useMemo(() => allLearningPaths.filter(lp =>
    matchesSearch(learningPathCatalogSearch, lp.title, lp.description)
  ), [allLearningPaths, learningPathCatalogSearch])

  const activeHierarchy = useMemo(() => hierarchyCourses.filter(ac =>
    matchesSearch(listSearch, ac.courses?.title)
  ), [hierarchyCourses, listSearch])

  const activeUserAssignments = useMemo(() => userAssignments.filter(ua =>
    matchesSearch(listSearch, ua.courses?.title, ua.users?.email)
  ), [userAssignments, listSearch])

  const activeOrganizationLearningPaths = useMemo(() => organizationLearningPaths.filter(assignment =>
    assignment.status === 'active' &&
    matchesSearch(listSearch, assignment.learning_path?.title)
  ), [organizationLearningPaths, listSearch])

  const activeUserLearningPathAssignments = useMemo(() => userLearningPathAssignments.filter(assignment =>
    assignment.status === 'assigned' &&
    matchesSearch(listSearch, assignment.learning_path?.title, assignment.user?.email)
  ), [userLearningPathAssignments, listSearch])

  const unifiedOrgItems = useMemo<UnifiedOrgItem[]>(() => {
    const courseItems: UnifiedOrgItem[] = contentTypeFilter !== 'paths'
      ? activeHierarchy.map(data => ({ kind: 'course', data }))
      : []
    const pathItems: UnifiedOrgItem[] = contentTypeFilter !== 'courses'
      ? activeOrganizationLearningPaths.map(data => ({ kind: 'path', data }))
      : []
    return [...courseItems, ...pathItems]
  }, [activeHierarchy, activeOrganizationLearningPaths, contentTypeFilter])

  const unifiedUserItems = useMemo<UnifiedUserItem[]>(() => {
    const courseItems: UnifiedUserItem[] = contentTypeFilter !== 'paths'
      ? activeUserAssignments.map(data => ({ kind: 'course', data }))
      : []
    const pathItems: UnifiedUserItem[] = contentTypeFilter !== 'courses'
      ? activeUserLearningPathAssignments.map(data => ({ kind: 'path', data }))
      : []
    return [...courseItems, ...pathItems]
  }, [activeUserAssignments, activeUserLearningPathAssignments, contentTypeFilter])

  return {
    // State
    activeTab, setActiveTab,
    contentTypeFilter, setContentTypeFilter,
    loading,
    isCatalogOpen, setIsCatalogOpen,
    isLearningPathCatalogOpen, setIsLearningPathCatalogOpen,
    isAssignUserModalOpen, setIsAssignUserModalOpen,
    isAssignLearningPathModalOpen, setIsAssignLearningPathModalOpen,
    assigningId,
    isAssigning,
    catalogSearch, setCatalogSearch,
    learningPathCatalogSearch, setLearningPathCatalogSearch,
    listSearch, setListSearch,
    selectedCourseForUser, setSelectedCourseForUser,
    selectedUserForCourse, setSelectedUserForCourse,
    selectedLearningPathForUser, setSelectedLearningPathForUser,
    selectedUserForLearningPath, setSelectedUserForLearningPath,
    toast, setToast,
    // Data
    hierarchyCourses,
    allCourses,
    organizationLearningPaths,
    userLearningPathAssignments,
    allLearningPaths,
    members,
    filteredCatalog,
    filteredLearningPathCatalog,
    activeHierarchy,
    activeUserAssignments,
    activeOrganizationLearningPaths,
    activeUserLearningPathAssignments,
    unifiedOrgItems,
    unifiedUserItems,
    // Default-content rules
    courseDefaultRules,
    learningPathDefaultRules,
    hierarchyNodes,
    defaultModalTarget,
    openDefaultModal,
    closeDefaultModal,
    handleDefaultChanged,
    // Handlers
    handleAssignToOrg,
    handleAssignLearningPathToOrg,
    handleAssignToUser,
    handleAssignLearningPathToUser,
    handleRemoveHierarchy,
    handleRemoveUserAssignment,
    handleRemoveOrganizationLearningPath,
    handleRemoveUserLearningPathAssignment,
  }
}
