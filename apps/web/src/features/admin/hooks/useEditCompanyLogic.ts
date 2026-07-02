'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getAdminApiErrorMessage } from '../services/admin-api-errors'

// ============================================
// TYPES (re-exported for page consumption)
// ============================================
export interface CompanyMember {
    id: string
    user_id: string
    role: string | null
    status: string | null
    joined_at: string | null
    user?: {
        id: string
        email: string
        username: string | null
        first_name: string | null
        last_name: string | null
        display_name: string | null
        profile_picture_url: string | null
    }
}

export interface AssignedCourse {
    id: string
    title: string | null
    assigned_at: string
}

export interface CompanyData {
    id: string
    name: string
    slug: string | null
    description: string | null
    logo_url: string | null
    brand_logo_url: string | null
    brand_banner_url: string | null
    brand_favicon_url: string | null
    brand_color_primary: string | null
    brand_color_secondary: string | null
    brand_color_accent: string | null
    brand_font_family: string | null
    contact_email: string | null
    contact_phone: string | null
    website_url: string | null
    subscription_plan: string | null
    subscription_status: string | null
    subscription_start_date: string | null
    subscription_end_date: string | null
    is_active: boolean
    max_users: number | null
    total_users: number
    active_users: number
    invited_users: number
    suspended_users: number
    google_login_enabled: boolean
    microsoft_login_enabled: boolean
    members: CompanyMember[]
    pending_invitations: Record<string, unknown>[]
    bulk_invite_links: Record<string, unknown>[]
    assigned_courses?: AssignedCourse[]
}

// ============================================
// HOOK
// ============================================
export function useEditCompanyLogic() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const companyId = params.id as string
    const initialTab = searchParams.get('tab') || 'general'

    // State
    const [activeTab, setActiveTab] = useState(initialTab)
    const [company, setCompany] = useState<CompanyData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Modals
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // Load company data
    const loadCompany = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/companies/${companyId}`)
            const data = await res.json().catch(() => null)

            if (res.ok && data?.success && data.company) {
                setCompany(data.company)
            } else {
                setError(getAdminApiErrorMessage(data, 'No se pudo cargar la empresa'))
            }
        } catch {
            setError('Error al cargar la empresa')
        } finally {
            setLoading(false)
        }
    }, [companyId])

    useEffect(() => {
        if (companyId) {
            loadCompany()
        }
    }, [companyId, loadCompany])

    const handleSave = async () => {
        if (!company) return

        setSaving(true)
        setSaveSuccess(false)
        setError(null)

        try {
            const res = await fetch(`/api/admin/companies/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company)
            })

            const data = await res.json().catch(() => null)

            if (res.ok && data?.success) {
                if (data.company) {
                    setCompany(data.company)
                }
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                setError(getAdminApiErrorMessage(data, 'Error al guardar'))
            }
        } catch {
            setError('Error al guardar los cambios')
        } finally {
            setSaving(false)
        }
    }

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId)
        window.history.pushState(null, '', `?tab=${tabId}`)
    }

    const handleDelete = async (confirmName: string) => {
        setIsDeleting(true)
        setDeleteError(null)

        try {
            const res = await fetch(`/api/admin/companies/${companyId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmName }),
            })

            const data = await res.json().catch(() => null)

            if (res.ok && data?.success) {
                router.push('/admin/companies')
                return
            }

            setDeleteError(getAdminApiErrorMessage(data, 'Error al eliminar la organización'))
        } catch {
            setDeleteError('Error al eliminar la organización')
        } finally {
            setIsDeleting(false)
        }
    }

    return {
        // Navigation
        router,
        companyId,
        activeTab,
        handleTabChange,

        // Data
        company,
        setCompany,
        loadCompany,

        // Async status
        loading,
        saving,
        error,
        saveSuccess,

        // Handlers
        handleSave,

        // Modal state
        isInviteModalOpen,
        setIsInviteModalOpen,

        // Delete organization
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        isDeleting,
        deleteError,
        handleDelete,
    }
}
