'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminUnifiedInviteModal } from '@/features/admin/components/AdminUnifiedInviteModal'
import { AdminMemberManageModal } from '@/features/admin/components/AdminMemberManageModal'
import { CoursesSection as CompanyCoursesSection } from '@/features/admin/components/CoursesSection'
import {
    ArrowLeftIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ArrowPathIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ChartBarIcon,
    PaintBrushIcon,
    BellIcon,
    DocumentTextIcon,
    CreditCardIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    PhotoIcon,
    SwatchIcon,
    CheckIcon,
    XMarkIcon,
    PencilSquareIcon,
    TrashIcon,
    EyeIcon
} from '@heroicons/react/24/outline'
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

// ============================================
// DESIGN SYSTEM - SOFLIA COLORS
// ============================================
const colors = {
    primary: '#0A2540',
    accent: '#00D4B3',
    bgPrimary: '#0A0D12',
    bgSecondary: '#1E2329',
    bgTertiary: '#0F1419',
    grayMedium: '#8899A6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899'
}

// ============================================
// TYPES
// ============================================
interface CompanyData {
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
    members: CompanyMember[]
}

interface CompanyMember {
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

// ============================================
// NAV ITEMS
// ============================================
const NAV_ITEMS = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon, color: colors.accent },
    { id: 'users', label: 'Usuarios', icon: UserGroupIcon, color: colors.blue },
    { id: 'courses', label: 'Cursos', icon: AcademicCapIcon, color: colors.purple },
    { id: 'stats', label: 'Estadísticas', icon: ChartBarIcon, color: colors.success },
    { id: 'customization', label: 'Personalización', icon: PaintBrushIcon, color: colors.pink },
    { id: 'notifications', label: 'Notificaciones', icon: BellIcon, color: colors.warning },
    { id: 'certificates', label: 'Certificados', icon: DocumentTextIcon, color: '#06B6D4' }
]

// ============================================
// SECTION WRAPPER
// ============================================
function SectionWrapper({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {children}
        </motion.div>
    )
}

// ============================================
// CARD COMPONENT
// ============================================
interface CardProps {
    title: string
    description?: string
    icon?: React.ElementType
    iconColor?: string
    children: React.ReactNode
    actions?: React.ReactNode
}

function Card({ title, description, icon: Icon, iconColor = colors.accent, children, actions }: CardProps) {
    return (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.bgSecondary }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: `${colors.grayMedium}15` }}>
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="p-3 rounded-xl" style={{ backgroundColor: `${iconColor}15` }}>
                            <Icon className="h-5 w-5" style={{ color: iconColor }} />
                        </div>
                    )}
                    <div>
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                        {description && <p className="text-sm" style={{ color: colors.grayMedium }}>{description}</p>}
                    </div>
                </div>
                {actions && <div>{actions}</div>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    )
}

// ============================================
// INPUT FIELD
// ============================================
interface InputFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
    placeholder?: string
    icon?: React.ElementType
}

function InputField({ label, value, onChange, type = 'text', placeholder, icon: Icon }: InputFieldProps) {
    return (
        <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">{label}</label>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Icon className="h-4 w-4" style={{ color: colors.grayMedium }} />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4B3] transition-colors`}
                    style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                />
            </div>
        </div>
    )
}

// ============================================
// GENERAL SECTION
// ============================================
function GeneralSection({ company, setCompany }: { company: CompanyData; setCompany: (c: CompanyData) => void }) {
    return (
        <SectionWrapper>
            {/* Información Básica */}
            <Card title="Información Básica" description="Datos principales de la empresa" icon={BuildingOffice2Icon}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Nombre de la empresa"
                        value={company.name}
                        onChange={(v) => setCompany({ ...company, name: v })}
                    />
                    <InputField
                        label="Slug (URL)"
                        value={company.slug || ''}
                        onChange={(v) => setCompany({ ...company, slug: v.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="mi-empresa"
                    />
                </div>
                <div className="mt-4">
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Descripción</label>
                    <textarea
                        value={company.description || ''}
                        onChange={(e) => setCompany({ ...company, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4B3] transition-colors resize-none"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                        placeholder="Descripción de la empresa..."
                    />
                </div>
            </Card>

            {/* Información de Contacto */}
            <Card title="Información de Contacto" description="Datos de contacto de la empresa" icon={EnvelopeIcon} iconColor={colors.blue}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Email de contacto"
                        value={company.contact_email || ''}
                        onChange={(v) => setCompany({ ...company, contact_email: v })}
                        type="email"
                        placeholder="contacto@empresa.com"
                        icon={EnvelopeIcon}
                    />
                    <InputField
                        label="Teléfono"
                        value={company.contact_phone || ''}
                        onChange={(v) => setCompany({ ...company, contact_phone: v })}
                        type="tel"
                        placeholder="+52 55 1234 5678"
                        icon={PhoneIcon}
                    />
                </div>
                <div className="mt-4">
                    <InputField
                        label="Sitio web"
                        value={company.website_url || ''}
                        onChange={(v) => setCompany({ ...company, website_url: v })}
                        type="url"
                        placeholder="https://www.empresa.com"
                        icon={GlobeAltIcon}
                    />
                </div>
            </Card>

            {/* Branding */}
            <Card title="Branding" description="Logos y recursos visuales" icon={PhotoIcon} iconColor={colors.purple}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                        label="URL del Logo"
                        value={company.brand_logo_url || company.logo_url || ''}
                        onChange={(v) => setCompany({ ...company, brand_logo_url: v })}
                        placeholder="https://..."
                    />
                    <InputField
                        label="URL del Banner"
                        value={company.brand_banner_url || ''}
                        onChange={(v) => setCompany({ ...company, brand_banner_url: v })}
                        placeholder="https://..."
                    />
                    <InputField
                        label="URL del Favicon"
                        value={company.brand_favicon_url || ''}
                        onChange={(v) => setCompany({ ...company, brand_favicon_url: v })}
                        placeholder="https://..."
                    />
                </div>

                {/* Preview */}
                {(company.brand_banner_url || company.brand_logo_url || company.logo_url) && (
                    <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.bgTertiary }}>
                        <p className="text-xs font-medium text-white/50 mb-3 uppercase">Vista previa</p>
                        <div
                            className="h-24 rounded-lg relative overflow-hidden"
                            style={{
                                backgroundColor: `${colors.grayMedium}20`,
                                backgroundImage: company.brand_banner_url ? `url(${company.brand_banner_url})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <div className="absolute -bottom-5 left-4">
                                <div
                                    className="h-14 w-14 rounded-xl overflow-hidden border-3 flex items-center justify-center"
                                    style={{ backgroundColor: colors.bgSecondary, borderColor: colors.bgSecondary, borderWidth: '3px' }}
                                >
                                    {(company.brand_logo_url || company.logo_url) ? (
                                        <img src={company.brand_logo_url || company.logo_url || ''} alt="Logo" className="h-full w-full object-contain" />
                                    ) : (
                                        <BuildingOffice2Icon className="h-7 w-7" style={{ color: colors.grayMedium }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Estado y Límites */}
            <Card title="Estado y Límites" description="Configuración de estado de la empresa" icon={Cog6ToothIcon} iconColor={colors.warning}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">Máximo de usuarios</label>
                        <input
                            type="number"
                            min="1"
                            value={company.max_users || ''}
                            onChange={(e) => setCompany({ ...company, max_users: parseInt(e.target.value) || null })}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm text-white focus:outline-none focus:border-[#00D4B3]"
                            style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-1.5">Estado de la empresa</label>
                        <div className="flex items-center gap-3 h-[42px]">
                            <button
                                onClick={() => setCompany({ ...company, is_active: !company.is_active })}
                                className="relative w-12 h-6 rounded-full transition-colors"
                                style={{ backgroundColor: company.is_active ? colors.success : `${colors.grayMedium}40` }}
                            >
                                <motion.div
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                    animate={{ left: company.is_active ? '1.75rem' : '0.25rem' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                            <span className="text-sm text-white">
                                {company.is_active ? 'Empresa activa' : 'Empresa pausada'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </SectionWrapper>
    )
}

// ============================================
// USERS SECTION
// ============================================
function UsersSection({ company, onUpdate }: { company: CompanyData; onUpdate: () => void }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [manageMember, setManageMember] = useState<any>(null)
    const [manageMode, setManageMode] = useState<'edit' | 'delete' | null>(null)

    const filteredMembers = company.members?.filter(member => {
        const matchesSearch = !searchTerm ||
            member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'all' || member.role === roleFilter
        return matchesSearch && matchesRole
    }) || []

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
                <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bgSecondary }}>
                    <p className="text-2xl font-bold text-white">{company.total_users}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Total usuarios</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bgSecondary }}>
                    <p className="text-2xl font-bold" style={{ color: colors.success }}>{company.active_users}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Activos</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bgSecondary }}>
                    <p className="text-2xl font-bold" style={{ color: colors.warning }}>{company.invited_users}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Invitados</p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: colors.bgSecondary }}>
                    <p className="text-2xl font-bold" style={{ color: colors.accent }}>{company.max_users || '∞'}</p>
                    <p className="text-xs" style={{ color: colors.grayMedium }}>Máximo permitido</p>
                </div>
            </div>

            {/* Users List */}
            <Card
                title="Miembros de la Empresa"
                description={`${filteredMembers.length} usuarios encontrados`}
                icon={UserGroupIcon}
                iconColor={colors.blue}
                actions={
                    <motion.button
                        onClick={() => setIsInviteModalOpen(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Invitar usuario
                    </motion.button>
                }
            >
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.grayMedium }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4B3]"
                            style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border text-sm text-white focus:outline-none focus:border-[#00D4B3]"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                    >
                        <option value="all">Todos los roles</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Miembros</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
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
                                                    <p className="text-sm font-medium text-white">{getUserDisplayName(member.user)}</p>
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
                    {filteredMembers.length === 0 && (
                        <div className="text-center py-8">
                            <UserGroupIcon className="h-12 w-12 mx-auto mb-3" style={{ color: colors.grayMedium }} />
                            <p className="text-sm" style={{ color: colors.grayMedium }}>No se encontraron usuarios</p>
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
        </SectionWrapper>
    )
}

// ============================================
// COURSES SECTION
// ============================================
function CoursesSection({ company }: { company: CompanyData }) {
    return (
        <SectionWrapper>
            <div className="space-y-6">
                <Card
                    title="Cursos de la Organización"
                    description="Gestiona los cursos disponibles para todos los miembros"
                    icon={AcademicCapIcon}
                    iconColor={colors.purple}
                >
                    <CompanyCoursesSection companyId={company.id} />
                </Card>
            </div>
        </SectionWrapper>
    )
}

// ============================================
// STATS SECTION
// ============================================
function StatsSection({ company }: { company: CompanyData }) {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/admin/companies/${company.id}/stats`)
                const data = await res.json()
                if (data.success) {
                    setStats(data.stats)
                }
            } catch (err) {
                console.error('Error fetching stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [company.id])

    if (loading) {
        return (
            <div className="py-20 text-center">
                <ArrowPathIcon className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: colors.accent }} />
                <p className="text-white/60">Calculando métricas en tiempo real...</p>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="py-20 text-center">
                <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-4" style={{ color: colors.error }} />
                <p className="text-white/60">No pudimos cargar las estadísticas</p>
            </div>
        )
    }

    const { overview, activityMonthly, courseProgress, teamDistribution } = stats

    const COLORS_CHART = [colors.accent, colors.purple, colors.blue, colors.success, colors.error, colors.warning]

    return (
        <SectionWrapper>
            {/* Cards de Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border border-white/5" 
                    style={{ backgroundColor: colors.bgSecondary }}
                >
                    <p className="text-3xl font-black text-white">{overview.totalUsers}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: colors.grayMedium }}>Usuarios Totales</p>
                </motion.div>
                
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border border-white/5" 
                    style={{ backgroundColor: colors.bgSecondary }}
                >
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black" style={{ color: colors.success }}>{overview.engagementRate}%</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: colors.grayMedium }}>Compromiso Semanal</p>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border border-white/5" 
                    style={{ backgroundColor: colors.bgSecondary }}
                >
                    <p className="text-3xl font-black" style={{ color: colors.accent }}>{overview.assignedCourses}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: colors.grayMedium }}>Cursos Adquiridos</p>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-2xl shadow-lg border border-white/5" 
                    style={{ backgroundColor: colors.bgSecondary }}
                >
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black" style={{ color: colors.purple }}>{overview.avgSatisfaction}</p>
                        <span className="text-sm font-bold opacity-40">/ 5</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2" style={{ color: colors.grayMedium }}>Satisfacción (LIA NPS)</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Actividad */}
                <Card 
                    title="Engagement Temporal" 
                    description="Evolución de horas de aprendizaje (últimos 6 meses)" 
                    icon={ChartBarIcon} 
                    iconColor={colors.blue}
                >
                    <div className="h-64 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityMonthly}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.blue} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={colors.blue} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: colors.grayMedium, fontSize: 10, fontWeight: 'bold' }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: colors.grayMedium, fontSize: 10, fontWeight: 'bold' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1E2329', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: colors.accent, fontWeight: 'bold' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="hours" 
                                    stroke={colors.blue} 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorHours)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Distribución por Equipo */}
                <Card 
                    title="Distribución por Equipos" 
                    description="Participación según departamento o zona" 
                    icon={UsersIcon} 
                    iconColor={colors.success}
                >
                    <div className="h-64 w-full mt-4 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={teamDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {teamDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1E2329', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-1/3 space-y-2 pr-4">
                            {teamDistribution.slice(0, 4).map((team: any, idx: number) => (
                                <div key={team.name} className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS_CHART[idx % COLORS_CHART.length] }} />
                                    <p className="text-[10px] font-bold text-white/60 truncate">{team.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Cursos */}
                <Card 
                    title="Rendimiento por Curso" 
                    description="Promedio de progreso y graduación" 
                    icon={AcademicCapIcon} 
                    iconColor={colors.purple}
                >
                    <div className="space-y-6 mt-4">
                        {courseProgress.map((course: any, idx: number) => (
                            <div key={course.id} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-white font-bold text-sm truncate">{course.title}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: colors.grayMedium }}>
                                            {course.enrolledCount} alumnos · {course.completedCount} graduados
                                        </p>
                                    </div>
                                    <span className="text-sm font-black" style={{ color: colors.accent }}>{course.averageProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${course.averageProgress}%` }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: idx % 2 === 0 ? colors.purple : colors.accent }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Métricas de Valor */}
                <Card 
                    title="Impacto del Aprendizaje" 
                    description="Métricas de calidad y constancia" 
                    icon={SparklesIcon} 
                    iconColor={colors.warning}
                >
                    <div className="grid grid-cols-2 gap-4 mt-4 h-full">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black" style={{ color: colors.blue }}>{overview.totalSessions}</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-white/40">Lecciones Completas</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center text-center">
                            <p className="text-2xl font-black" style={{ color: colors.warning }}>{Math.round(overview.totalLearningHours / 24)}d</p>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-white/40">Tiempo Acumulado</p>
                        </div>
                        <div className="col-span-2 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white/60">Salud del Ecosistema</p>
                                    <p className="text-xs font-bold mt-1">Nivel de compromiso: <span style={{ color: overview.engagementRate > 30 ? colors.success : colors.warning }}>{overview.engagementRate > 60 ? 'Excepcional' : overview.engagementRate > 30 ? 'Saludable' : 'En riesgo'}</span></p>
                                </div>
                                <SparklesIcon className="h-8 w-8 opacity-20" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </SectionWrapper>
    )
}

// ============================================
// CUSTOMIZATION SECTION
// ============================================
function CustomizationSection({ company, setCompany }: { company: CompanyData; setCompany: (c: CompanyData) => void }) {
    // Valores por defecto
    const primaryColor = company.brand_color_primary || '#3b82f6'
    const secondaryColor = company.brand_color_secondary || '#10b981'
    const accentColor = company.brand_color_accent || '#8b5cf6'
    const fontFamily = company.brand_font_family || 'Inter'

    const validFonts = ['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Source Sans Pro']

    return (
        <SectionWrapper>
            <Card
                title="Paleta de Colores"
                description="Personaliza los colores de la marca"
                icon={SwatchIcon}
                iconColor={colors.pink}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Color Primario</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_primary: e.target.value })}
                                className="h-10 w-14 rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_primary: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm text-white"
                                style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Color Secundario</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_secondary: e.target.value })}
                                className="h-10 w-14 rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setCompany({ ...company, brand_color_secondary: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm text-white"
                                style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-white/70 mb-2">Color de Acento</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setCompany({ ...company, brand_color_accent: e.target.value })}
                                className="h-10 w-14 rounded-lg cursor-pointer border-0"
                                style={{ backgroundColor: 'transparent' }}
                            />
                            <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => setCompany({ ...company, brand_color_accent: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border text-sm text-white"
                                style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.bgTertiary }}>
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase">Vista previa</p>
                    <div className="flex gap-3">
                        <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: primaryColor }} />
                        <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: secondaryColor }} />
                        <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: accentColor }} />
                    </div>
                </div>
            </Card>

            <Card
                title="Tipografía"
                description="Selecciona la fuente de la marca"
                icon={PaintBrushIcon}
                iconColor={colors.purple}
            >
                <div>
                    <label className="block text-xs font-medium text-white/70 mb-2">Fuente principal</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => setCompany({ ...company, brand_font_family: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm text-white focus:outline-none focus:border-[#00D4B3]"
                        style={{ backgroundColor: colors.bgTertiary, borderColor: `${colors.grayMedium}20` }}
                    >
                        {validFonts.map((font) => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>
                </div>

                {/* Font Preview */}
                <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.bgTertiary }}>
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase">Vista previa</p>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily }}>
                        Vista previa de texto
                    </p>
                    <p className="text-base text-white/70 mt-1" style={{ fontFamily }}>
                        Así se verá el texto con la fuente seleccionada
                    </p>
                </div>
            </Card>

            <Card
                title="Estilos del Panel"
                description="Personaliza el aspecto del panel de administración"
                icon={PaintBrushIcon}
                iconColor={colors.grayMedium}
            >
                <div className="text-center py-8">
                    <PaintBrushIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.grayMedium }} />
                    <p className="text-lg font-medium text-white mb-2">Próximamente</p>
                    <p className="text-sm" style={{ color: colors.grayMedium }}>
                        Configuración avanzada de estilos (panel_styles, login_styles, user_dashboard_styles)
                    </p>
                </div>
            </Card>
        </SectionWrapper>
    )
}

// ============================================
// NOTIFICATIONS SECTION
// ============================================
function NotificationsSection({ company }: { company: CompanyData }) {
    return (
        <SectionWrapper>
            <Card
                title="Preferencias de Notificaciones"
                description="Configura cómo y cuándo enviar notificaciones"
                icon={BellIcon}
                iconColor={colors.warning}
            >
                <div className="text-center py-12">
                    <BellIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.grayMedium }} />
                    <p className="text-lg font-medium text-white mb-2">Próximamente</p>
                    <p className="text-sm" style={{ color: colors.grayMedium }}>
                        Configuración de notificaciones próximamente
                    </p>
                </div>
            </Card>
        </SectionWrapper>
    )
}

// ============================================
// CERTIFICATES SECTION
// ============================================
function CertificatesSection({ company }: { company: CompanyData }) {
    return (
        <SectionWrapper>
            <Card
                title="Plantillas de Certificados"
                description="Diseña las plantillas para los certificados"
                icon={DocumentTextIcon}
                iconColor="#06B6D4"
                actions={
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                        <PlusIcon className="h-4 w-4" />
                        Nueva plantilla
                    </motion.button>
                }
            >
                <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.grayMedium }} />
                    <p className="text-lg font-medium text-white mb-2">Próximamente</p>
                    <p className="text-sm" style={{ color: colors.grayMedium }}>
                        Diseñador de certificados próximamente
                    </p>
                </div>
            </Card>
        </SectionWrapper>
    )
}


// ============================================
// MAIN COMPONENT
// ============================================
export default function EditCompanyPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const companyId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [activeSection, setActiveSection] = useState(searchParams.get('tab') || 'general')
    const [company, setCompany] = useState<CompanyData | null>(null)

    // Cargar datos de la empresa
    const loadCompany = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/companies/${companyId}`)
            const data = await res.json()

            if (data.success && data.company) {
                setCompany(data.company)
            } else {
                setError('No se pudo cargar la empresa')
            }
        } catch (err) {
            setError('Error al cargar la empresa')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (companyId) {
            loadCompany()
        }
    }, [companyId])

    const handleSave = async () => {
        if (!company) return

        setIsSaving(true)
        setSaveSuccess(false)

        try {
            const res = await fetch(`/api/admin/companies/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company)
            })

            const data = await res.json()

            if (data.success) {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            } else {
                setError(data.error || 'Error al guardar')
            }
        } catch (err) {
            setError('Error al guardar los cambios')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
                <div className="text-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto" style={{ color: colors.accent }} />
                    <p className="mt-4 text-white">Cargando empresa...</p>
                </div>
            </div>
        )
    }

    if (error && !company) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto" style={{ color: colors.error }} />
                    <p className="mt-4 text-white">{error}</p>
                    <button
                        onClick={() => router.push('/admin/companies')}
                        className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                        Volver a empresas
                    </button>
                </div>
            </div>
        )
    }

    if (!company) return null

    const renderSection = () => {
        switch (activeSection) {
            case 'general':
                return <GeneralSection company={company} setCompany={setCompany} />
            case 'users':
                return <UsersSection company={company} onUpdate={loadCompany} />
            case 'courses':
                return <CoursesSection company={company} />
            case 'stats':
                return <StatsSection company={company} />
            case 'customization':
                return <CustomizationSection company={company} setCompany={setCompany} />
            case 'notifications':
                return <NotificationsSection company={company} />
            case 'certificates':
                return <CertificatesSection company={company} />
            default:
                return <GeneralSection company={company} setCompany={setCompany} />
        }
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
            {/* Header */}
            <div
                className="sticky top-0 z-40 border-b backdrop-blur-lg"
                style={{ backgroundColor: `${colors.bgPrimary}95`, borderColor: `${colors.grayMedium}15` }}
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <motion.button
                                onClick={() => router.push('/admin/companies')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-xl transition-colors"
                                style={{ backgroundColor: `${colors.grayMedium}15`, color: colors.grayMedium }}
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </motion.button>
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden"
                                    style={{ backgroundColor: `${colors.accent}15` }}
                                >
                                    {company.brand_logo_url || company.logo_url ? (
                                        <img src={company.brand_logo_url || company.logo_url || ''} alt="" className="h-full w-full object-contain" />
                                    ) : (
                                        <BuildingOffice2Icon className="h-5 w-5" style={{ color: colors.accent }} />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">{company.name}</h1>
                                    <p className="text-xs" style={{ color: colors.grayMedium }}>Gestión de empresa</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <AnimatePresence>
                                {saveSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl"
                                        style={{ backgroundColor: `${colors.success}20`, color: colors.success }}
                                    >
                                        <CheckCircleIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">Guardado</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <motion.button
                                onClick={handleSave}
                                disabled={isSaving}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                style={{ backgroundColor: colors.accent, color: colors.primary }}
                            >
                                {isSaving ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4" />
                                        Guardar cambios
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex gap-6">
                    {/* Sidebar Navigation */}
                    <div className="w-56 flex-shrink-0">
                        <nav className="sticky top-24 space-y-1">
                            {NAV_ITEMS.map((item) => {
                                const isActive = activeSection === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isActive ? 'bg-opacity-100' : 'opacity-60 hover:opacity-100'
                                            }`}
                                        style={{
                                            backgroundColor: isActive ? `${item.color}15` : 'transparent',
                                            color: isActive ? item.color : 'white'
                                        }}
                                    >
                                        <item.icon className="h-5 w-5" style={{ color: isActive ? item.color : colors.grayMedium }} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {renderSection()}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
