
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ClockIcon,
    UserCircleIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    InboxIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import { useAdminPendingCourses } from '../hooks/useAdminPendingCourses'
import { ConfirmationModal } from './ConfirmationModal'
import { createClient } from '../../../lib/supabase/client'

// Reutilizamos variantes de animación
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

function CourseThumbnail({ thumbnailUrl, title }: { thumbnailUrl?: string; title: string }) {
    // Versión simplificada del thumbnail
    if (!thumbnailUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400" />
            </div>
        )
    }
    return <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
}

interface AdminPendingCoursesPageProps {
    basePath?: string
}

export function AdminPendingCoursesPage({ basePath = '/admin/courses/pending' }: AdminPendingCoursesPageProps) {
    const router = useRouter()
    const { t } = useTranslation('admin')
    const { courses, isLoading, error, refetch, approveCourse, rejectCourse, deleteCourse } = useAdminPendingCourses()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending')
    const [courseToApprove, setCourseToApprove] = useState<string | null>(null)
    const [courseToReject, setCourseToReject] = useState<string | null>(null)
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
    const [actionError, setActionError] = useState<string | null>(null)
    // const [rejectionReason, setRejectionReason] = useState('') // Implementar modal con motivo si se desea

    const filteredCourses = courses.filter(course =>
        (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        course.approval_status === activeTab
    )

    const handleApprove = async () => {
        if (!courseToApprove) return

        // La validación de usuario se hace ahora en el server action para mayor robustez
        // Pasamos '' como fallback
        const success = await approveCourse(courseToApprove, '')

        if (!success) {
            setActionError(t('pendingCourses.errorApprove'))
        }
        setCourseToApprove(null)
    }

    const handleReject = async () => {
        if (!courseToReject) return
        const reason = 'Rechazado por el administrador' // TODO: Pedir motivo en un modal
        // TODO: Pedir motivo en un modal
        const success = await rejectCourse(courseToReject, reason)
        if (!success) {
            setActionError(t('pendingCourses.errorReject'))
        }
        setCourseToReject(null)
    }

    const handleDelete = async () => {
        if (!courseToDelete) return
        const success = await deleteCourse(courseToDelete)
        if (!success) {
            setActionError(t('pendingCourses.errorDelete'))
        }
        setCourseToDelete(null)
    }

    if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('pendingCourses.loading')}</div>
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary dark:text-white mb-2">
                        {t('pendingCourses.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-white/60">
                        {t('pendingCourses.subtitle')}
                    </p>
                </div>

                {actionError && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
                        <span>{actionError}</span>
                        <button onClick={() => setActionError(null)} className="ml-4 text-red-400 hover:text-red-300">×</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-500/30">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending'
                            ? 'border-accent text-primary dark:text-white'
                            : 'border-transparent text-gray-500 dark:text-white/60 hover:text-primary dark:hover:text-white'
                            }`}
                    >
                        {t('pendingCourses.tabPending')}
                    </button>
                    <button
                        onClick={() => setActiveTab('rejected')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rejected'
                            ? 'border-error text-error'
                            : 'border-transparent text-gray-500 dark:text-white/60 hover:text-error'
                            }`}
                    >
                        {t('pendingCourses.tabRejected')}
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-carbon-800 rounded-xl border border-gray-200 dark:border-gray-500/30 p-4 mb-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder={t('pendingCourses.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent border border-gray-200 dark:border-gray-500/30 rounded-lg text-primary dark:text-white placeholder-gray-500 dark:placeholder-white/60 focus:ring-2 focus:ring-accent/40 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-carbon-800 rounded-xl border border-gray-200 dark:border-gray-500/30 border-dashed">
                        <InboxIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {activeTab === 'pending' ? t('pendingCourses.emptyPending') : t('pendingCourses.emptyRejected')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'pending' ? t('pendingCourses.emptyPendingDesc') : t('pendingCourses.emptyRejectedDesc')}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredCourses.map((course) => (
                            <motion.div
                                key={course.id}
                                variants={itemVariants}
                                className="bg-white dark:bg-carbon-800 rounded-2xl border border-gray-200 dark:border-gray-500/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="h-48 relative bg-gray-200 dark:bg-gray-800">
                                    <CourseThumbnail thumbnailUrl={course.thumbnail_url} title={course.title} />
                                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                                        {course.approval_status === 'rejected' ? (
                                            <span className="backdrop-blur-md bg-error/20 dark:bg-error/30 text-error dark:text-[var(--color-legacy-fca5a5)] text-xs font-semibold px-2.5 py-0.5 rounded border border-error/30 dark:border-error/40">
                                                {t('pendingCourses.statusRejected')}
                                            </span>
                                        ) : (
                                            <span className="backdrop-blur-md bg-warning/20 dark:bg-warning/30 text-warning dark:text-[var(--color-legacy-fcd34d)] text-xs font-semibold px-2.5 py-0.5 rounded border border-warning/30 dark:border-warning/40">
                                                {t('pendingCourses.statusPending')}
                                            </span>
                                        )}
                                        {course.is_update ? (
                                            <span className="backdrop-blur-md bg-info/20 dark:bg-info/30 text-info dark:text-[var(--color-legacy-93c5fd)] text-xs font-semibold px-2.5 py-0.5 rounded border border-info/30 dark:border-info/40">
                                                {t('pendingCourses.statusUpdate')}
                                            </span>
                                        ) : (
                                            <span className="backdrop-blur-md bg-success/20 dark:bg-success/30 text-success dark:text-[var(--color-legacy-6ee7b7)] text-xs font-semibold px-2.5 py-0.5 rounded border border-success/30 dark:border-success/40">
                                                {t('pendingCourses.statusNew')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-primary dark:text-white mb-2 line-clamp-1">
                                        {course.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                                        <UserCircleIcon className="h-4 w-4" />
                                        <span>{course.instructor_name}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500 mb-4 border-t border-gray-200 dark:border-gray-500/20 pt-3">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" /> {new Date(course.created_at).toLocaleDateString()}
                                        </span>
                                        <span>{course.level}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCourseToApprove(course.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-success hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                                            title={t('pendingCourses.tooltipApprove')}
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            {activeTab === 'rejected' ? t('pendingCourses.btnReconsider') : t('pendingCourses.btnApprove')}
                                        </button>
                                        <button
                                            onClick={() => router.push(`${basePath}/${course.id}`)}
                                            className="px-3 py-2 bg-gray-50 dark:bg-[var(--color-legacy-2c3036)] hover:bg-gray-200 dark:hover:bg-[var(--color-legacy-3a3f45)] text-[var(--color-legacy-495057)] dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                                            title={t('pendingCourses.tooltipDetails')}
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                        {activeTab === 'pending' && (
                                            <button
                                                onClick={() => setCourseToReject(course.id)}
                                                className="px-3 py-2 bg-[var(--color-legacy-fef2f2)] hover:bg-[var(--color-legacy-fee2e2)] text-error rounded-lg text-sm font-medium transition-colors"
                                                title={t('pendingCourses.tooltipReject')}
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        {activeTab === 'rejected' && (
                                            <button
                                                onClick={() => setCourseToDelete(course.id)}
                                                className="px-3 py-2 bg-[var(--color-legacy-fef2f2)] hover:bg-[var(--color-legacy-fee2e2)] text-error rounded-lg text-sm font-medium transition-colors border border-error/20"
                                                title={t('pendingCourses.tooltipDelete')}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Modals de confirmación (usando ConfirmationModal si existe o simple confirm) */}
            {/* Por simplicidad usaré el componente ConfirmationModal que vi en la lista de archivos */}
            {courseToApprove && (
                <ConfirmationModal
                    isOpen={!!courseToApprove}
                    onClose={() => setCourseToApprove(null)}
                    onConfirm={handleApprove}
                    title={t('pendingCourses.approveModal.title')}
                    message={t('pendingCourses.approveModal.message')}
                    confirmText={t('pendingCourses.approveModal.confirm')}
                    type="success"
                />
            )}

            {courseToReject && (
                <ConfirmationModal
                    isOpen={!!courseToReject}
                    onClose={() => setCourseToReject(null)}
                    onConfirm={handleReject}
                    title={t('pendingCourses.rejectModal.title')}
                    message={t('pendingCourses.rejectModal.message')}
                    confirmText={t('pendingCourses.rejectModal.confirm')}
                    type="danger"
                />
            )}

            {courseToDelete && (
                <ConfirmationModal
                    isOpen={!!courseToDelete}
                    onClose={() => setCourseToDelete(null)}
                    onConfirm={handleDelete}
                    title={t('pendingCourses.deleteModal.title')}
                    message={t('pendingCourses.deleteModal.message')}
                    confirmText={t('pendingCourses.deleteModal.confirm')}
                    type="danger"
                />
            )}
        </div>
    )
}
