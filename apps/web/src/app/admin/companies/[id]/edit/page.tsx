'use client'

import { useEditCompanyLogic } from '@/features/admin/hooks/useEditCompanyLogic'
import { useAdminTheme } from '@/features/admin/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { CoursesSection as AdminCoursesSection } from '@/features/admin/components'
import {
    ArrowLeftIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { NAV_ITEMS } from './sections/shared'
import { GeneralSection } from './sections/GeneralSection'
import { UsersSection } from './sections/UsersSection'
import { StatsSection } from './sections/StatsSection'
import { CustomizationSection } from './sections/CustomizationSection'
import { NotificationsSection } from './sections/NotificationsSection'
import { CertificatesSection } from './sections/CertificatesSection'

export default function EditCompanyPage() {
    const theme = useAdminTheme()
    const {
        router,
        companyId,
        activeTab,
        handleTabChange,
        company,
        setCompany,
        loadCompany,
        loading,
        saving,
        error,
        handleSave,
    } = useEditCompanyLogic()

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: theme.background }}
            >
                <div className="text-center">
                    <ArrowPathIcon
                        className="h-8 w-8 animate-spin mx-auto"
                        style={{ color: theme.action }}
                    />
                    <p className="mt-4 text-sm font-medium" style={{ color: theme.textMuted }}>Cargando empresa...</p>
                </div>
            </div>
        )
    }

    if (error && !company) {
        return (
            <div
                className="min-h-screen flex items-center justify-center px-6"
                style={{ background: theme.background }}
            >
                <div className="text-center">
                    <ExclamationTriangleIcon
                        className="h-12 w-12 mx-auto"
                        style={{ color: theme.danger }}
                    />
                    <p className="mt-4 text-sm font-medium" style={{ color: theme.text }}>{error}</p>
                    <button
                        onClick={() => router.push('/admin/companies')}
                        className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ background: theme.primary, color: theme.inverseText }}
                    >
                        Volver a empresas
                    </button>
                </div>
            </div>
        )
    }

    if (!company) return null

    const renderSection = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSection company={company} setCompany={setCompany} />
            case 'users':
                return <UsersSection company={company} onUpdate={loadCompany} />
            case 'courses':
                return <AdminCoursesSection companyId={companyId} />
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
        <div
            className="min-h-screen font-inter"
            style={{ background: theme.background, color: theme.text }}
        >
            {/* Header / Nav */}
            <div
                className="sticky top-0 z-30 border-b shadow-sm"
                style={{ background: theme.surface, borderColor: theme.divider }}
            >
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.back()}
                            className="p-2.5 rounded-lg transition-colors hover:opacity-80"
                            style={{ color: theme.textMuted }}
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </motion.button>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                                style={{ background: theme.actionSurface, borderColor: theme.focusRing }}
                            >
                                {company.brand_logo_url ? (
                                    <img src={company.brand_logo_url} alt="" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <BuildingOffice2Icon className="h-6 w-6" style={{ color: theme.action }} />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: theme.text }}>{company.name}</h1>
                                <p className="text-xs font-medium" style={{ color: theme.textMuted }}>Gestión de empresa</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                            style={{
                                background: theme.primary,
                                color: theme.inverseText,
                                boxShadow: theme.shadow,
                            }}
                        >
                            {saving ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                            )}
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </motion.button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto flex min-h-[calc(100vh-5rem)]">
                {/* Sidebar */}
                <div
                    className="w-80 border-r p-6 space-y-2 shrink-0 hidden lg:block"
                    style={{ background: theme.surface, borderColor: theme.divider }}
                >
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className="group relative flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all hover:translate-x-0.5"
                                style={{
                                    background: isActive ? theme.primary : 'transparent',
                                    color: isActive ? theme.inverseText : theme.textMuted,
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-8 rounded-r-full"
                                        style={{ background: theme.inverseText }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon className="h-5 w-5 transition-colors" />
                                <span className="text-sm font-semibold transition-colors">
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        {renderSection()}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
