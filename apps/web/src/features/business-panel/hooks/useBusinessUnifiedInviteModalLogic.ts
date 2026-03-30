'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Pause, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { inviteUserAction } from '@/features/auth/actions/invitation'

type InviteMode = 'individual' | 'bulk' | 'manage'
type ModalStatus = 'idle' | 'loading' | 'success' | 'error'

interface CreatedLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
}

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

interface Props {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  onLinkCreated?: () => void
  organizationId?: string
  organizationSlug?: string
}

export function useBusinessUnifiedInviteModalLogic({
  isOpen,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  organizationSlug,
}: Props) {
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

  const [mode, setMode] = useState<InviteMode>('individual')
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const [individualForm, setIndividualForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    position: '',
    customMessage: ''
  })
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const [bulkForm, setBulkForm] = useState({
    name: '',
    maxUses: 100,
    role: 'member' as 'owner' | 'admin' | 'member',
    expiresAt: ''
  })
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [copied, setCopied] = useState(false)

  const [links, setLinks] = useState<BulkInviteLink[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

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

  useEffect(() => {
    if (isOpen && mode === 'manage') {
      fetchLinks()
    }
  }, [isOpen, mode])

  useEffect(() => {
    if (!isOpen) {
      setMode('individual')
      setStatus('idle')
      setError(null)
      setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' })
      setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' })
      setSuccessEmail(null)
      setCreatedLink(null)
      setCopied(false)
      setLinks([])
      setLinksError(null)
      setOpenMenuId(null)
    }
  }, [isOpen])

  const roleLabels = {
    member: {
      label: t('users.roles.member', 'Miembro'),
      desc: t('users.modals.invite.roleDesc.member', 'Acceso básico a la plataforma')
    },
    admin: {
      label: t('users.roles.admin', 'Administrador'),
      desc: t('users.modals.invite.roleDesc.admin', 'Puede gestionar usuarios y contenido')
    },
    owner: {
      label: t('users.roles.owner', 'Propietario'),
      desc: t('users.modals.invite.roleDesc.owner', 'Control total de la organización')
    }
  }

  const fetchLinks = async () => {
    setIsLoadingLinks(true)
    setLinksError(null)
    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Error al cargar enlaces')
      setLinks(data.links || [])
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al cargar enlaces')
    } finally {
      setIsLoadingLinks(false)
    }
  }

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)
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
      setStatus('success')
      setSuccessEmail(individualForm.email)
      setTimeout(() => {
        onInviteSent?.()
        onClose()
      }, 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error al enviar invitación')
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)
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
      setStatus('success')
      onLinkCreated?.()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error al crear el enlace')
    }
  }

  const getInviteUrl = (token?: string) => {
    const tok = token || createdLink?.token
    if (!tok) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${tok}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyLink = async (link: BulkInviteLink) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(link.token))
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
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

  const handleCreateAnother = () => {
    setStatus('idle')
    setCreatedLink(null)
    setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' })
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 7)
    setBulkForm(prev => ({
      ...prev,
      expiresAt: defaultExpiry.toISOString().slice(0, 16)
    }))
  }

  const getStatusConfig = (linkStatus: string) => {
    switch (linkStatus) {
      case 'active':
        return { label: t('users.modals.manageLinks.status.active', 'Activo'), color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle }
      case 'paused':
        return { label: t('users.modals.manageLinks.status.paused', 'Pausado'), color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Pause }
      case 'expired':
        return { label: t('users.modals.manageLinks.status.expired', 'Expirado'), color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: Clock }
      case 'exhausted':
        return { label: t('users.modals.manageLinks.status.exhausted', 'Agotado'), color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: XCircle }
      default:
        return { label: linkStatus, color: mutedText, bgColor: inputBg, icon: AlertCircle }
    }
  }

  return {
    t,
    isDark, textColor, mutedText, borderColor, inputBg,
    primaryColor, accentColor,
    mode, setMode,
    status,
    error,
    individualForm, setIndividualForm,
    successEmail,
    bulkForm, setBulkForm,
    createdLink,
    copied,
    links,
    isLoadingLinks,
    linksError,
    copiedId,
    actionLoading,
    openMenuId, setOpenMenuId,
    roleLabels,
    fetchLinks,
    handleIndividualSubmit,
    handleBulkSubmit,
    getInviteUrl,
    handleCopy,
    handleCopyLink,
    handleLinkAction,
    handleCreateAnother,
    getStatusConfig,
  }
}
