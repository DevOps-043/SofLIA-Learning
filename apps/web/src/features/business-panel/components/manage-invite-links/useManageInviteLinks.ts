'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BulkInviteLink, InviteLinkAction } from './invite-links.types'

interface UseManageInviteLinksParams {
  isOpen: boolean
  orgSlug: string
}

export function useManageInviteLinks({ isOpen, orgSlug }: UseManageInviteLinksParams) {
  const { t } = useTranslation('business')
  const [links, setLinks] = useState<BulkInviteLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const fetchLinks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || t('users.modals.manageLinks.errorLoad'))
      setLinks(data.links || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.modals.manageLinks.errorLoad'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) void fetchLinks()
  }, [isOpen])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const getInviteUrl = (token: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`
  const handleCopy = async (link: BulkInviteLink) => {
    await navigator.clipboard.writeText(getInviteUrl(link.token))
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }
  const handleAction = async (linkId: string, action: InviteLinkAction) => {
    setActionLoading(linkId)
    setOpenMenuId(null)
    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: action === 'delete' ? undefined : { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: action === 'delete' ? undefined : JSON.stringify({ action }),
      })
      const data = action === 'delete' ? null : await response.json()
      if (!response.ok || (data && !data.success)) throw new Error(data?.error || t('users.modals.manageLinks.errorOperation'))
      setLinks(prev => action === 'delete' ? prev.filter(link => link.id !== linkId) : prev.map(link => link.id === linkId ? data.link : link))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.modals.manageLinks.errorOperation'))
    } finally {
      setActionLoading(null)
    }
  }

  return { actionLoading, copiedId, error, fetchLinks, getInviteUrl, handleAction, handleCopy, isLoading, links, menuRef, openMenuId, setError, setOpenMenuId }
}
