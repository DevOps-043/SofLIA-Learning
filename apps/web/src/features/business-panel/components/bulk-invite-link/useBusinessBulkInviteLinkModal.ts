'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { DEFAULT_FORM_DATA, getDefaultExpiresAt } from './defaults'
import { buildRoleLabels } from './role-labels'
import type { BulkInviteFormData, CreatedLink, ModalStatus } from './types'

interface UseBusinessBulkInviteLinkModalParams {
  isOpen: boolean
  onLinkCreated?: () => void
  organizationSlug?: string
}

export function useBusinessBulkInviteLinkModal({
  isOpen,
  onLinkCreated,
  organizationSlug,
}: UseBusinessBulkInviteLinkModalParams) {
  const params = useParams()
  const orgSlug = organizationSlug || (params?.orgSlug as string)
  const { t } = useTranslation('business')
  const [formData, setFormData] = useState<BulkInviteFormData>(DEFAULT_FORM_DATA)
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || formData.expiresAt) return
    setFormData(prev => ({ ...prev, expiresAt: getDefaultExpiresAt() }))
  }, [formData.expiresAt, isOpen])

  useEffect(() => {
    if (isOpen) return
    setFormData(DEFAULT_FORM_DATA)
    setStatus('idle')
    setError(null)
    setCreatedLink(null)
    setCopied(false)
  }, [isOpen])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxUses' ? parseInt(value, 10) || 0 : value,
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, name: formData.name || null }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || t('users.modals.bulkInvite.errorCreate'))
      setCreatedLink(data.link)
      setStatus('success')
      onLinkCreated?.()
    } catch (issue) {
      setStatus('error')
      setError(issue instanceof Error ? issue.message : t('users.modals.bulkInvite.errorCreate'))
    }
  }

  const getInviteUrl = () => {
    if (!createdLink) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${createdLink.token}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (issue) {
      console.error('Failed to copy:', issue)
    }
  }

  return {
    copied,
    createdLink,
    error,
    formData,
    getInviteUrl,
    handleChange,
    handleCopy,
    handleSubmit,
    resetCreatedLink: () => {
      setStatus('idle')
      setCreatedLink(null)
    },
    roleLabels: buildRoleLabels(t),
    setError,
    setFormData,
    setStatus,
    status,
  }
}
