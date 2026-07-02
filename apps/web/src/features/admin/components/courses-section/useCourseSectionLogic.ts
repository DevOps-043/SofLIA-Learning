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

    // Fetch each independent resource concurrently. A single slow/failed
    // resource must not block or abort the others (fail-soft per resource),
    // so every fetch is wrapped and its own errors are logged individually.
    const loadResource = async (label: string, run: () => Promise<void>): Promise<boolean> => {
      try {
        await run()
        return true
      } catch (error) {
        techDebtLogger.error(`Error fetching courses data (${label}):`, error)
        return false
      }
    }

    const results = await Promise.all([
      loadResource('org-courses', async () => {
        const res = await fetch(`/api/admin/companies/${companyId}/courses`)
        const data = await res.json()
        if (data.success) setHierarchyCourses(data.courses)
      }),
      loadResource('user-assignments', async () => {
        const res = await fetch(`/api/admin/companies/${companyId}/user-assignments`)
        const data = await res.json()
        if (data.success) setUserAssignments(data.assignments)
      }),
      loadResource('catalog-courses', async () => {
        const res = await fetch('/api/admin/courses')
        const data = await res.json()
        if (data.success) {
          const approvedCourses = (data.courses as Course[]).filter((course) =>
            course.is_active === true && (course.approval_status === 'approved' || !course.approval_status)
          )
          setAllCourses(approvedCourses)
        }
      }),
      loadResource('catalog-learning-paths', async () => {
        const res = await fetch('/api/admin/learning-paths')
        const data = await res.json()
        if (data.success) {
          setAllLearningPaths((data.learningPaths || []).filter((path: LearningPath) => path.is_active))
        }
      }),
      loadResource('org-learning-paths', async () => {
        const res = await fetch(`/api/admin/companies/${companyId}/learning-paths`)
        const data = await res.json()
        if (data.success) setOrganizationLearningPaths(data.assignments || [])
      }),
      loadResource('user-learning-paths', async () => {
        const res = await fetch(`/api/admin/companies/${companyId}/user-learning-path-assignments`)
        const data = await res.json()
        if (data.success) setUserLearningPathAssignments(data.assignments || [])
      }),
      loadResource('company-members', async () => {
        const res = await fetch(`/api/admin/companies/${companyId}`)
        const data = await res.json()
        if (data.success && data.company) setMembers(data.company.members || [])
      }),
      loadResource('course-defaults', async () => {
        const { rules, nodes } = await AdminContentDefaultsService.getCourseDefaults(companyId)
        setCourseDefaultRules(rules)
        setHierarchyNodes(nodes)
      }),
      loadResource('learning-path-defaults', async () => {
        const { rules } = await AdminContentDefaultsService.getLearningPathDefaults(companyId)
        setLearningPathDefaultRules(rules)
      }),
    ])

    if (results.some((ok) => !ok)) {
      showToast('Error al cargar parte de la información', 'error')
    }

    setLoading(false)
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
    c.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(catalogSearch.toLowerCase())
  ), [allCourses, catalogSearch])

  const filteredLearningPathCatalog = useMemo(() => allLearningPaths.filter(lp =>
    lp.title.toLowerCase().includes(learningPathCatalogSearch.toLowerCase()) ||
    (lp.description || '').toLowerCase().includes(learningPathCatalogSearch.toLowerCase())
  ), [allLearningPaths, learningPathCatalogSearch])

  const activeHierarchy = useMemo(() => hierarchyCourses.filter(ac =>
    ac.courses.title.toLowerCase().includes(listSearch.toLowerCase())
  ), [hierarchyCourses, listSearch])

  const activeUserAssignments = useMemo(() => userAssignments.filter(ua =>
    ua.courses.title.toLowerCase().includes(listSearch.toLowerCase()) ||
    ua.users.email.toLowerCase().includes(listSearch.toLowerCase())
  ), [userAssignments, listSearch])

  const activeOrganizationLearningPaths = useMemo(() => organizationLearningPaths.filter(assignment =>
    assignment.status === 'active' &&
    (assignment.learning_path?.title || '').toLowerCase().includes(listSearch.toLowerCase())
  ), [organizationLearningPaths, listSearch])

  const activeUserLearningPathAssignments = useMemo(() => userLearningPathAssignments.filter(assignment =>
    assignment.status === 'assigned' && (
      (assignment.learning_path?.title || '').toLowerCase().includes(listSearch.toLowerCase()) ||
      (assignment.user?.email || '').toLowerCase().includes(listSearch.toLowerCase())
    )
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
