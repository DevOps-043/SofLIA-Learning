'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { Course, AssignedCourse, UserAssignment, CompanyMember } from './courses-section.types'

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
      const hRes = await fetch(`/api/admin/companies/${companyId}/courses`)
      const hData = await hRes.json()
      if (hData.success) setHierarchyCourses(hData.courses)

      const uRes = await fetch(`/api/admin/companies/${companyId}/user-assignments`)
      const uData = await uRes.json()
      if (uData.success) setUserAssignments(uData.assignments)

      const cRes = await fetch('/api/admin/courses')
      const cData = await cRes.json()
      if (cData.success) {
        const approvedCourses = (cData.courses as Course[]).filter((course) =>
          course.is_active === true && (course.approval_status === 'approved' || !course.approval_status)
        )
        setAllCourses(approvedCourses)
      }

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

  const filteredCatalog = useMemo(() => allCourses.filter(c =>
    c.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(catalogSearch.toLowerCase())
  ), [allCourses, catalogSearch])

  const activeHierarchy = useMemo(() => hierarchyCourses.filter(ac =>
    ac.courses.title.toLowerCase().includes(listSearch.toLowerCase())
  ), [hierarchyCourses, listSearch])

  const activeUserAssignments = useMemo(() => userAssignments.filter(ua =>
    ua.courses.title.toLowerCase().includes(listSearch.toLowerCase()) ||
    ua.users.email.toLowerCase().includes(listSearch.toLowerCase())
  ), [userAssignments, listSearch])

  return {
    // State
    activeTab, setActiveTab,
    loading,
    isCatalogOpen, setIsCatalogOpen,
    isAssignUserModalOpen, setIsAssignUserModalOpen,
    assigningId,
    isAssigning,
    catalogSearch, setCatalogSearch,
    listSearch, setListSearch,
    selectedCourseForUser, setSelectedCourseForUser,
    selectedUserForCourse, setSelectedUserForCourse,
    toast, setToast,
    // Data
    hierarchyCourses,
    allCourses,
    members,
    filteredCatalog,
    activeHierarchy,
    activeUserAssignments,
    // Handlers
    handleAssignToOrg,
    handleAssignToUser,
    handleRemoveHierarchy,
    handleRemoveUserAssignment,
  }
}
