'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { HierarchyService } from '../../../services/hierarchy.service'
import { DynamicHierarchyService } from '../../../services/dynamicHierarchy.service'
import type {
  NodeDetails,
  OrganizationNodeProperties,
  UpdateNodeRequest,
} from '../../../types/dynamicHierarchy.types'
import type { NodeMember } from '../../../types/hierarchy.types'
import type { NodeFormProps } from '../NodeForm'
import { useHierarchyAnalytics } from '../../../hooks/useHierarchyAnalytics'
import { HierarchyEntityType } from '../../../types/hierarchy-assignments.types'

function toHierarchyEntityType(value: string | undefined): HierarchyEntityType {
  if (value === 'region' || value === 'zone' || value === 'team') return value
  return 'team'
}

export function useNodeDashboardState(nodeId: string) {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [data, setData] = useState<NodeDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'learning' | 'chat' | 'members'>('overview')
  const [members, setMembers] = useState<NodeMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [initialRole, setInitialRole] = useState<'member' | 'leader'>('member')
  const [selectedCourseForIndividual, setSelectedCourseForIndividual] = useState<{ id: string; title: string } | null>(null)

  const hierarchyEntityType = toHierarchyEntityType(data?.node.type)

  const { analytics } = useHierarchyAnalytics(hierarchyEntityType, nodeId, {
    disabled: !data
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await HierarchyService.getNodeDetails(nodeId, orgSlug)
      if (result) {
        setData(result)
      } else {
        setError('No se pudo cargar la información del nodo')
      }
    } catch (err) {
      console.error(err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    if (activeTab === 'members') {
      fetchMembers()
    }
  }, [nodeId, activeTab])

  const fetchMembers = async () => {
    setLoadingMembers(true)
    try {
      const result = await HierarchyService.getNodeMembers(nodeId, orgSlug)
      setMembers(result)
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleEditSave: NodeFormProps['onSave'] = async (
    name: string,
    type: string,
    properties?: OrganizationNodeProperties,
    managerId?: string
  ) => {
    try {
      const payload: UpdateNodeRequest = {
        name,
        type,
        properties,
        manager_id: managerId ?? null,
      }
      await DynamicHierarchyService.updateNode(nodeId, payload)
      fetchData()
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating node:', error)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('¿Estás seguro de remover a este miembro del nodo?')) return
    try {
      await HierarchyService.removeUserFromNode(nodeId, userId, orgSlug)
      fetchMembers()
      fetchData()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Error al remover miembro')
    }
  }

  return {
    orgSlug,
    data,
    loading,
    error,
    activeTab, setActiveTab,
    members,
    loadingMembers,
    showEditModal, setShowEditModal,
    showAssignmentModal, setShowAssignmentModal,
    showMemberModal, setShowMemberModal,
    initialRole, setInitialRole,
    selectedCourseForIndividual, setSelectedCourseForIndividual,
    hierarchyEntityType,
    analytics,
    fetchData,
    fetchMembers,
    handleEditSave,
    handleRemoveMember,
  }
}
