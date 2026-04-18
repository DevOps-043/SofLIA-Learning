'use client'

import { useState } from 'react'
import { useEditCompanyLogic, type CompanyData, type CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../../../core/hooks/useTheme'
import { CoursesSection as AdminCoursesSection } from '@/features/admin/components'
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
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    PhotoIcon,
    PencilSquareIcon,
    TrashIcon,
    UsersIcon,
    SparklesIcon,
    ShieldCheckIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon,
    SwatchIcon,
    LinkIcon
} from '@heroicons/react/24/outline'
import { GeneralSection } from './sections/GeneralSection'
import { UsersSection } from './sections/UsersSection'
import { StatsSection } from './sections/StatsSection'
import { CustomizationSection } from './sections/CustomizationSection'
import { NotificationsSection } from './sections/NotificationsSection'
import { CertificatesSection } from './sections/CertificatesSection'

interface CourseProgress {
    id: string
    title: string
    enrolledCount: number
    completedCount: number
    averageProgress: number
    completionRate: number
}

export default function EditCompanyPage() {
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0D12]">
                <div className="text-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-[#0A2540] dark:text-[#00D4B3]" />
                    <p className="mt-4 text-gray-500 dark:text-white/70">Cargando empresa...</p>
                </div>
            </div>
        )
    }

    if (error && !company) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0D12]">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500" />
                    <p className="mt-4 text-gray-900 dark:text-white">{error}</p>
                    <button
                        onClick={() => router.push('/admin/companies')}
                        className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-[#0A2540] text-white dark:bg-[#00D4B3] dark:text-[#0A2540]"
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
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A0D12] text-gray-900 dark:text-white font-inter">
            {/* Header / Nav */}
            <div className="bg-white dark:bg-[#1E2329] border-b border-gray-100 dark:border-white/5 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.back()}
                            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-[#8899A6] transition-colors"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </motion.button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#0A2540]/10 dark:bg-[#00D4B3]/10 flex items-center justify-center border border-[#0A2540]/20 dark:border-[#00D4B3]/20">
                                {company.brand_logo_url ? (
                                    <img src={company.brand_logo_url} alt="" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <BuildingOffice2Icon className="h-6 w-6 text-[#0A2540] dark:text-[#00D4B3]" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                                <p className="text-xs text-gray-500 dark:text-[#8899A6]">Gestión de empresa</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-[#0A2540] text-white font-bold text-sm shadow-lg shadow-[#0A2540]/20 flex items-center gap-2 hover:bg-[#0d2f4d] disabled:opacity-50 transition-all dark:bg-[#00D4B3] dark:text-[#0A2540] dark:shadow-[#00D4B3]/20 dark:hover:bg-[#00b89a]"
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
                <div className="w-80 border-r border-gray-100 dark:border-white/5 p-6 space-y-2 shrink-0 hidden lg:block bg-white dark:bg-[#0A0D12]">
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabChange(item.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative group ${isActive ? 'bg-[#0A2540]/5 dark:bg-[#00D4B3]/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1.5 h-8 bg-[#0A2540] dark:bg-[#00D4B3] rounded-r-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-gray-400 dark:text-[#8899A6] group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                                <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-gray-500 dark:text-[#8899A6] group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        {renderSection()}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
