'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Pause, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { inviteUserAction } from '@/features/auth/actions/invitation'
import { useThemeStore } from '@/core/stores/themeStore'

// ============================================
// TYPES
// ============================================
interface BusinessInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  organizationId?: string
  organizationSlug?: string
  defaultTab?: 'individual' | 'bulk' | 'manage'
}

type TabType = 'individual' | 'bulk' | 'manage'
type InviteStatus = 'idle' | 'loading' | 'success' | 'error'

interface BulkInviteLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  current_uses: number
  role: string
  expires_at: string
  status: 'active' | 'paused' | 'expired' | 'exhausted'
  created_at: string
}

interface CreatedLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
}

export function useBusinessInviteModalLogic({
  isOpen,
  onClose,
  onInviteSent,
  organizationId,
  organizationSlug,
  defaultTab = 'individual'
}: BusinessInviteModalProps) {
  const params = useParams()
  const orgSlug = organizationSlug || (params?.orgSlug as string)
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const panelStyles = styles?.panel

  const isDark = resolvedTheme === 'dark'
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  // Individual invite state
  const [individualForm, setIndividualForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    position: '',
    customMessage: ''
  })
  const [individualStatus, setIndividualStatus] = useState<InviteStatus>('idle')
  const [individualError, setIndividualError] = useState<string | null>(null)
  const [individualSuccess, setIndividualSuccess] = useState<string | null>(null)

  // Bulk link state
  const [bulkForm, setBulkForm] = useState({
    name: '',
    maxUses: 100,
    role: 'member' as 'owner' | 'admin' | 'member',
    expiresAt: ''
  })
  const [bulkStatus, setBulkStatus] = useState<InviteStatus>('idle')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Manage links state
  const [links, setLinks] = useState<BulkInviteLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Set default expiration date for bulk
  useEffect(() => {
    if (isOpen && !bulkForm.expiresAt) {
      const defaultExpiry = new Date()
      defaultExpiry.setDate(defaultExpiry.getDate() + 7)
      setBulkForm(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().slice(0, 16)
      }))
    }
  }, [isOpen])

  // Fetch links when manage tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'manage') {
      fetchLinks()
    }
  }, [isOpen, activeTab])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(defaultTab)
      // Reset individual
      setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' })
      setIndividualStatus('idle')
      setIndividualError(null)
      setIndividualSuccess(null)
      // Reset bulk
      setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' })
      setBulkStatus('idle')
      setBulkError(null)
      setCreatedLink(null)
      setCopied(false)
      // Reset manage
      setLinksError(null)
      setOpenMenuId(null)
    }
  }, [isOpen, defaultTab])

  const fetchLinks = async () => {
    setLinksLoading(true)
    setLinksError(null)
    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Error al cargar enlaces')
      setLinks(data.links || [])
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al cargar enlaces')
    } finally {
      setLinksLoading(false)
    }
  }

  // Individual invite handlers
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIndividualStatus('loading')
    setIndividualError(null)

    try {
      if (!organizationId) throw new Error('No se encontró la organización')

      const result = await inviteUserAction({
        email: individualForm.email,
        role: individualForm.role,
        organizationId,
        position: individualForm.position || undefined,
        customMessage: individualForm.customMessage || undefined
      })

      if (result.error) throw new Error(result.error)

      setIndividualStatus('success')
      setIndividualSuccess(`Invitación enviada exitosamente a ${individualForm.email}`)

      setTimeout(() => {
        onInviteSent?.()
        setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' })
        setIndividualStatus('idle')
        setIndividualSuccess(null)
      }, 2000)
    } catch (err) {
      setIndividualStatus('error')
      setIndividualError(err instanceof Error ? err.message : 'Error al enviar invitación')
    }
  }

  // Bulk link handlers
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkStatus('loading')
    setBulkError(null)

    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: bulkForm.name || null,
          maxUses: bulkForm.maxUses,
          role: bulkForm.role,
          expiresAt: bulkForm.expiresAt
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Error al crear el enlace')

      setCreatedLink(data.link)
      setBulkStatus('success')
      onInviteSent?.()
    } catch (err) {
      setBulkStatus('error')
      setBulkError(err instanceof Error ? err.message : 'Error al crear el enlace')
    }
  }

  const getInviteUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${token}`
  }

  const handleCopyLink = async (token: string, linkId?: string) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token))
      if (linkId) {
        setCopiedId(linkId)
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleLinkAction = async (linkId: string, action: 'pause' | 'resume' | 'delete') => {
    setActionLoading(linkId)
    setOpenMenuId(null)

    try {
      if (action === 'delete') {
        const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al eliminar')
        }
        setLinks(prev => prev.filter(l => l.id !== linkId))
      } else {
        const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action })
        })
        const data = await response.json()
        if (!response.ok || !data.success) throw new Error(data.error || 'Error al actualizar')
        setLinks(prev => prev.map(l => l.id === linkId ? data.link : l))
      }
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error en la operación')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Activo', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle }
      case 'paused': return { label: 'Pausado', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Pause }
      case 'expired': return { label: 'Expirado', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: Clock }
      case 'exhausted': return { label: 'Agotado', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: XCircle }
      default: return { label: status, color: mutedText, bgColor: inputBg, icon: AlertCircle }
    }
  }

  const roleLabels: Record<string, { label: string; desc: string }> = {
    member: { label: t('users.roles.member', 'Miembro'), desc: 'Acceso básico a la plataforma' },
    admin: { label: t('users.roles.admin', 'Administrador'), desc: 'Puede gestionar usuarios y contenido' },
    owner: { label: t('users.roles.owner', 'Propietario'), desc: 'Control total de la organización' }
  }

  const tabs = [
    { id: 'individual' as TabType, label: 'Invitación Individual', icon: 'Mail' as const },
    { id: 'bulk' as TabType, label: 'Crear Enlace Masivo', icon: 'Link2' as const },
    { id: 'manage' as TabType, label: 'Administrar Enlaces', icon: 'Users' as const, badge: links.length > 0 ? links.length : undefined }
  ]

  return {
    // Theme / style derived values
    isDark,
    textColor,
    mutedText,
    borderColor,
    inputBg,
    primaryColor,
    accentColor,
    // i18n
    t,
    // Tab
    activeTab,
    setActiveTab,
    tabs,
    // Individual
    individualForm,
    setIndividualForm,
    individualStatus,
    individualError,
    individualSuccess,
    handleIndividualSubmit,
    // Bulk
    bulkForm,
    setBulkForm,
    bulkStatus,
    setBulkStatus,
    bulkError,
    createdLink,
    setCreatedLink,
    copied,
    handleBulkSubmit,
    // Manage
    links,
    linksLoading,
    linksError,
    setLinksError,
    copiedId,
    actionLoading,
    openMenuId,
    setOpenMenuId,
    fetchLinks,
    handleCopyLink,
    handleLinkAction,
    getInviteUrl,
    getStatusConfig,
    roleLabels,
  }
}
