'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { UserGroupIcon, DocumentTextIcon, EnvelopeIcon, PencilSquareIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, LinkIcon } from '@heroicons/react/24/outline'
import { AdminUnifiedInviteModal } from '@/features/admin/components/AdminUnifiedInviteModal'
import { AdminMemberManageModal } from '@/features/admin/components/AdminMemberManageModal'
import { resendInvitationAction, revokeInvitationAction } from '@/features/auth/actions/invitation'
import { SuccessModal } from '@/core/components/SuccessModal/SuccessModal'
import { ErrorModal } from '@/core/components/ErrorModal/ErrorModal'
import { ConfirmationModal } from '@/features/admin/components/ConfirmationModal'
import type { CompanyData, CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import { colors, SectionWrapper, Card } from './shared'

function UsersSection({ company, onUpdate }: { company: CompanyData; onUpdate: () => void }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [activeSubTab, setActiveSubTab] = useState<'members' | 'invitations' | 'links'>('members')
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [manageMember, setManageMember] = useState<CompanyMember | null>(null)
    const [manageMode, setManageMode] = useState<'edit' | 'delete' | null>(null)
    const [resendingId, setResendingId] = useState<string | null>(null)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null)

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error';
        title: string;
        message?: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    })

    const showModal = (type: 'success' | 'error', title: string, message?: string) => {
        setModalConfig({ isOpen: true, type, title, message })
    }

    const filteredMembers = company.members?.filter(member => {
        const matchesSearch = !searchTerm ||
            member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'all' || member.role === roleFilter
        return matchesSearch && matchesRole
    }) || []

    const filteredInvitations = company.pending_invitations?.filter(inv => {
        return !searchTerm || inv.email?.toLowerCase().includes(searchTerm.toLowerCase())
    }) || []

    const filteredLinks = company.bulk_invite_links?.filter(link => {
        return !searchTerm || link.name?.toLowerCase().includes(searchTerm.toLowerCase()) || link.token?.toLowerCase().includes(searchTerm.toLowerCase())
    }) || []

    const handleResendInvitation = async (invitationId: string) => {
        setResendingId(invitationId)
        try {
            const result = await resendInvitationAction(invitationId)
            if (result.success) {
                showModal('success', '¡Éxito!', 'Invitación reenviada con éxito')
            } else {
                showModal('error', 'Error', result.error || 'No se pudo reenviar la invitación')
            }
        } catch (error) {
            console.error('Error resending invitation:', error)
            showModal('error', 'Error de conexión', 'Hubo un problema al intentar reenviar la invitación')
        } finally {
            setResendingId(null)
        }
    }

    const handleRevokeInvitation = async (invitationId: string) => {
        setInvitationToRevoke(invitationId)
    }

    const confirmRevokeInvitation = async () => {
        if (!invitationToRevoke) return
        
        const invitationId = invitationToRevoke
        setInvitationToRevoke(null)
        setRevokingId(invitationId)
        try {
            const result = await revokeInvitationAction(invitationId)
            if (result.success) {
                showModal('success', '¡Éxito!', 'Invitación eliminada correctamente')
                onUpdate()
            } else {
                showModal('error', 'Error', result.error || 'No se pudo eliminar la invitación')
            }
        } catch (error) {
            console.error('Error revoking invitation:', error)
            showModal('error', 'Error de conexión', 'Hubo un problema al intentar eliminar la invitación')
        } finally {
            setRevokingId(null)
        }
    }

    const getUserDisplayName = (user?: CompanyMember['user']) => {
        if (!user) return 'Usuario'
        if (user.display_name) return user.display_name
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
        if (user.first_name) return user.first_name
        return user.email.split('@')[0]
    }

    const getRoleBadge = (role: string | null) => {
        switch (role) {
            case 'owner':
                return { label: 'Owner', color: colors.warning }
            case 'admin':
                return { label: 'Admin', color: colors.accent }
            default:
                return { label: 'Miembro', color: colors.grayMedium }
        }
    }

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'active':
                return { label: 'Activo', color: colors.success }
            case 'invited':
                return { label: 'Invitado', color: colors.warning }
            case 'suspended':
                return { label: 'Suspendido', color: colors.error }
            default:
                return { label: status || 'Desconocido', color: colors.grayMedium }
        }
    }

    return (
        <SectionWrapper>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{company.total_users}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Total usuarios</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5">
                    <p className="text-2xl font-bold" style={{ color: colors.success }}>{company.active_users}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Activos</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5">
                    <p className="text-2xl font-bold" style={{ color: colors.warning }}>{company.invited_users}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Invitados</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0F1419] border border-gray-100 dark:border-white/5">
                    <p className="text-2xl font-bold" style={{ color: colors.accent }}>{company.max_users || '∞'}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Máximo permitido</p>
                </div>
            </div>

            {/* Sub-Tabs Selector */}
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 p-1">
                <button
                    onClick={() => setActiveSubTab('members')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSubTab === 'members' ? 'bg-[#0A2540]/10 text-[#0A2540] dark:bg-[#00D4B3]/10 dark:text-[#00D4B3]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    Miembros
                </button>
                <button
                    onClick={() => setActiveSubTab('invitations')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSubTab === 'invitations' ? 'bg-[#0A2540]/10 text-[#0A2540] dark:bg-[#00D4B3]/10 dark:text-[#00D4B3]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    Invitaciones Individuales
                </button>
                <button
                    onClick={() => setActiveSubTab('links')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSubTab === 'links' ? 'bg-[#0A2540]/10 text-[#0A2540] dark:bg-[#00D4B3]/10 dark:text-[#00D4B3]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    Enlaces de Invitación
                </button>
            </div>

            {/* Users / Invitations / Links List */}
            <Card
                title={
                    activeSubTab === 'members' ? "Miembros de la Empresa" :
                    activeSubTab === 'invitations' ? "Invitaciones Pendientes" :
                    "Enlaces de Invitación Masiva"
                }
                description={
                    activeSubTab === 'members' ? `${filteredMembers.length} usuarios encontrados` :
                    activeSubTab === 'invitations' ? `${filteredInvitations.length} invitaciones activas` :
                    `${filteredLinks.length} enlaces creados`
                }
                icon={
                    activeSubTab === 'members' ? UserGroupIcon :
                    activeSubTab === 'invitations' ? EnvelopeIcon :
                    LinkIcon
                }
                iconColor={
                    activeSubTab === 'members' ? colors.blue :
                    activeSubTab === 'invitations' ? colors.warning :
                    colors.purple
                }
                actions={
                    <motion.button
                        onClick={() => setIsInviteModalOpen(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        {activeSubTab === 'links' ? 'Crear enlace' : 'Invitar usuario'}
                    </motion.button>
                }
            >
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.grayMedium }} />
                        <input
                            type="text"
                            placeholder={
                                activeSubTab === 'members' ? "Buscar por nombre o email..." :
                                activeSubTab === 'invitations' ? "Buscar por email..." :
                                "Buscar por nombre o token..."
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#0A2540] dark:focus:border-[#00D4B3] bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10"
                        />
                    </div>
                    {activeSubTab === 'members' && (
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0A2540] dark:focus:border-[#00D4B3] bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10"
                        >
                            <option value="all">Todos los roles</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Miembros</option>
                        </select>
                    )}
                </div>

                {/* Content Table */}
                <div className="overflow-x-auto">
                    {activeSubTab === 'members' && (
                        <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs uppercase" style={{ color: colors.grayMedium }}>
                                <th className="pb-3 font-medium">Usuario</th>
                                <th className="pb-3 font-medium">Rol</th>
                                <th className="pb-3 font-medium">Estado</th>
                                <th className="pb-3 font-medium">Fecha ingreso</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: `${colors.grayMedium}10` }}>
                            {filteredMembers.map((member) => {
                                const roleBadge = getRoleBadge(member.role)
                                const statusBadge = getStatusBadge(member.status)
                                return (
                                    <tr key={member.id} className="group">
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden"
                                                    style={{ backgroundColor: `${colors.accent}20` }}
                                                >
                                                    {member.user?.profile_picture_url ? (
                                                        <img src={member.user.profile_picture_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-medium" style={{ color: colors.accent }}>
                                                            {getUserDisplayName(member.user).charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName(member.user)}</p>
                                                    <p className="text-xs" style={{ color: colors.grayMedium }}>{member.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{ backgroundColor: `${roleBadge.color}20`, color: roleBadge.color }}
                                            >
                                                {roleBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{ backgroundColor: `${statusBadge.color}20`, color: statusBadge.color }}
                                            >
                                                {statusBadge.label}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-sm" style={{ color: colors.grayMedium }}>
                                                {member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-MX') : '-'}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setManageMember(member)
                                                        setManageMode('edit')
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setManageMember(member)
                                                        setManageMode('delete')
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                >
                                                    <TrashIcon className="h-4 w-4" style={{ color: colors.error }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        </table>
                    )}

                    {activeSubTab === 'invitations' && (
                        <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs uppercase" style={{ color: colors.grayMedium }}>
                                <th className="pb-3 font-medium">Email</th>
                                <th className="pb-3 font-medium">Rol</th>
                                <th className="pb-3 font-medium">Enviada</th>
                                <th className="pb-3 font-medium">Expira</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: `${colors.grayMedium}10` }}>
                            {filteredInvitations.map((inv) => (
                                <tr key={inv.id} className="group">
                                    <td className="py-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.email}</p>
                                    </td>
                                    <td className="py-3">
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium uppercase" style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}>
                                            {inv.role}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {new Date(inv.created_at).toLocaleDateString('es-MX')}
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {new Date(inv.expires_at).toLocaleDateString('es-MX')}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center justify-end gap-2 text-xs">
                                            <button
                                                onClick={() => handleResendInvitation(inv.id)}
                                                disabled={resendingId === inv.id}
                                                className="px-3 py-1.5 rounded-lg border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                {resendingId === inv.id ? 'Reenviando...' : 'Reenviar'}
                                            </button>
                                            <button
                                                onClick={() => handleRevokeInvitation(inv.id)}
                                                disabled={revokingId === inv.id}
                                                className="px-3 py-1.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                {revokingId === inv.id ? 'Eliminando...' : 'Eliminar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    )}

                    {activeSubTab === 'links' && (
                        <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs uppercase" style={{ color: colors.grayMedium }}>
                                <th className="pb-3 font-medium">Nombre / Token</th>
                                <th className="pb-3 font-medium text-center">Usos</th>
                                <th className="pb-3 font-medium text-center">Límite</th>
                                <th className="pb-3 font-medium text-center">Estado</th>
                                <th className="pb-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: `${colors.grayMedium}10` }}>
                            {filteredLinks.map((link) => (
                                <tr key={link.id} className="group">
                                    <td className="py-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{link.name || 'Sin nombre'}</p>
                                        <p className="text-xs font-mono" style={{ color: colors.grayMedium }}>{link.token}</p>
                                    </td>
                                    <td className="py-3 text-center text-sm">
                                        {link.current_uses}
                                    </td>
                                    <td className="py-3 text-center text-sm">
                                        {link.max_uses || '∞'}
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${link.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {link.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.origin}/register?invite=${link.token}`
                                                    navigator.clipboard.writeText(url)
                                                    showModal('success', '¡Copiado!', 'Enlace copiado al portapapeles')
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                                title="Copiar enlace"
                                            >
                                                <DocumentTextIcon className="h-4 w-4" style={{ color: colors.grayMedium }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    )}

                    {(
                        (activeSubTab === 'members' && filteredMembers.length === 0) ||
                        (activeSubTab === 'invitations' && filteredInvitations.length === 0) ||
                        (activeSubTab === 'links' && filteredLinks.length === 0)
                    ) && (
                        <div className="text-center py-8">
                            <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3" style={{ color: colors.grayMedium }} />
                            <p className="text-sm" style={{ color: colors.grayMedium }}>No se encontraron elementos</p>
                        </div>
                    )}
                </div>
            </Card>

            <AdminUnifiedInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                organizationId={company.id}
                organizationSlug={company.slug || undefined}
                onInviteSent={onUpdate}
                onLinkCreated={onUpdate}
                primaryColor={colors.primary}
                accentColor={colors.accent}
            />

            <AdminMemberManageModal
                isOpen={manageMode !== null}
                onClose={() => {
                    setManageMode(null)
                    setManageMember(null)
                }}
                onUpdate={onUpdate}
                member={manageMember}
                companyId={company.id}
                mode={manageMode}
                primaryColor={colors.primary}
                accentColor={colors.accent}
            />

            <SuccessModal
                isOpen={modalConfig.isOpen && modalConfig.type === 'success'}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
            />

            <ErrorModal
                isOpen={modalConfig.isOpen && modalConfig.type === 'error'}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
            />

            <ConfirmationModal
                isOpen={invitationToRevoke !== null}
                onClose={() => setInvitationToRevoke(null)}
                onConfirm={confirmRevokeInvitation}
                title="Eliminar Invitación"
                message="¿Estás seguro de que deseas eliminar esta invitación? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
                isLoading={revokingId !== null}
            />
        </SectionWrapper>
    )
}


// ============================================
// STATS SECTION
// ============================================

export { UsersSection }
