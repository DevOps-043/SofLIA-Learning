'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    Cog6ToothIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ChartBarIcon,
    PaintBrushIcon,
    BellIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline'
import type { CompanyData, CompanyMember } from '@/features/admin/hooks/useEditCompanyLogic'

export type { CompanyData, CompanyMember }

const colors = {
    primary: '#0A2540',
    accent: '#00D4B3',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    grayMedium: '#8899A6',
}

// Types are imported from the hook (CompanyData, CompanyMember)

export interface CourseProgress {
    id: string
    title: string
    enrolledCount: number
    completedCount: number
    averageProgress: number
}

export interface StatsData {
    overview: {
        totalUsers: number
        engagementRate: number
        assignedCourses: number
        avgSatisfaction: number
        totalEnrolled: number
        totalGraduated: number
        activeInLast30Days: number
        averageCourseProgress: number
        totalSessions: number
        totalLearningHours: number
    }
    activityMonthly: Array<Record<string, unknown>>
    courseProgress: CourseProgress[]
    teamDistribution: Array<Record<string, unknown>>
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
    const usesThemeActionColor = iconColor === colors.accent

    return (
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#1E2329] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div
                            className={`p-3 rounded-xl ${usesThemeActionColor ? 'bg-[#0A2540]/10 dark:bg-[#00D4B3]/15' : ''}`}
                            style={usesThemeActionColor ? undefined : { backgroundColor: `${iconColor}15` }}
                        >
                            <Icon
                                className={`h-5 w-5 ${usesThemeActionColor ? 'text-[#0A2540] dark:text-[#00D4B3]' : ''}`}
                                style={usesThemeActionColor ? undefined : { color: iconColor }}
                            />
                        </div>
                    )}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                        {description && <p className="text-sm text-gray-500 dark:text-[#8899A6]">{description}</p>}
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
            <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">{label}</label>
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Icon className="h-4 w-4 text-gray-400 dark:text-[#8899A6]" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#0A2540] dark:focus:border-[#00D4B3] transition-colors`}
                />
            </div>
        </div>
    )
}

export { colors, NAV_ITEMS, SectionWrapper, Card, InputField }
