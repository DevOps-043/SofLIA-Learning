
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ChevronLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    BookOpenIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    QuestionMarkCircleIcon,
    ClockIcon,
    TrashIcon,
    ArrowPathIcon,
    PlusCircleIcon,
    MinusCircleIcon,
    ArrowsRightLeftIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { useAdminCourseDetail } from '../hooks/useAdminCourseDetail'
import { ConfirmationModal } from './ConfirmationModal'
import { createClient } from '../../../lib/supabase/client'
import type { DiffStatus, CourseDiff, DiffModule, DiffLesson, FieldChange } from '../../../lib/courseDiff'

interface AdminPendingCourseDetailPageProps {
    courseId: string
    successRedirectPath?: string
}

export function AdminPendingCourseDetailPage({
    courseId,
    successRedirectPath = '/admin/courses/pending'
}: AdminPendingCourseDetailPageProps) {
    const router = useRouter()
    const { course, isLoading, error, approveCourse, rejectCourse, deleteCourse, reconsiderCourse } = useAdminCourseDetail(courseId)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDiffView, setShowDiffView] = useState(true)

    const handleApprove = async () => {
        // La validación de usuario se hace ahora en el server action para mayor robustez
        const success = await approveCourse('') // Pasar string vacío como en la lista
        if (success) {
            router.push(successRedirectPath)
        } else {
            alert('Error al aprobar')
        }
        setShowApproveModal(false)
    }

    const handleReject = async () => {
        const success = await rejectCourse('Rechazado desde panel de detalle')
        if (success) {
            router.push(successRedirectPath)
        } else {
            alert('Error al rechazar')
        }
        setShowRejectModal(false)
    }

    const handleDelete = async () => {
        const success = await deleteCourse()
        if (success) {
            router.push(successRedirectPath)
        } else {
            alert('Error al eliminar')
        }
        setShowDeleteModal(false)
    }

    const handleReconsider = async () => {
        const success = await reconsiderCourse()
        if (success) {
            // Stay on page, status updates to pending (handled by hook/revalidate)
        } else {
            alert('Error al reconsiderar')
        }
    }

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>
    if (!course) return <div className="p-8">Curso no encontrado</div>

    const isRejected = course.approval_status === 'rejected'
    const hasDiff = !!course.diff
    const diff: CourseDiff | undefined = course.diff

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Navbar de navegación simple */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Volver a pendientes
            </button>

            {/* Cabecera del Curso */}
            <div className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
                        {course.thumbnail_url && (
                            <img src={course.thumbnail_url} alt="Portada" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                            {course.approval_status === 'rejected' ? (
                                <span className="backdrop-blur-md bg-[#EF4444]/20 dark:bg-[#EF4444]/30 text-[#EF4444] dark:text-[#FCA5A5] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#EF4444]/30 dark:border-[#EF4444]/40 uppercase tracking-widest">
                                    Rechazado
                                </span>
                            ) : (
                                <span className="backdrop-blur-md bg-[#F59E0B]/20 dark:bg-[#F59E0B]/30 text-[#F59E0B] dark:text-[#FCD34D] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#F59E0B]/30 dark:border-[#F59E0B]/40 uppercase tracking-widest">
                                    Pendiente
                                </span>
                            )}
                            {course.is_update ? (
                                <span className="backdrop-blur-md bg-[#3B82F6]/20 dark:bg-[#3B82F6]/30 text-[#3B82F6] dark:text-[#93C5FD] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#3B82F6]/30 dark:border-[#3B82F6]/40 uppercase tracking-widest">
                                    Actualización
                                </span>
                            ) : (
                                <span className="backdrop-blur-md bg-[#10B981]/20 dark:bg-[#10B981]/30 text-[#10B981] dark:text-[#6EE7B7] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#10B981]/30 dark:border-[#10B981]/40 uppercase tracking-widest">
                                    Nuevo
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{course.description}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                <ClockIcon className="h-4 w-4" />
                                {Math.round(course.duration_total_minutes / 60 * 10) / 10} horas
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
                                Nivel: {course.level}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
                                Categoría: {course.category}
                            </span>
                        </div>

                        <div className="mt-6 flex items-center gap-3 pt-4 border-t dark:border-gray-700">
                            {course.instructor?.profile_picture_url ? (
                                <img src={course.instructor.profile_picture_url} className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                    I
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {course.instructor?.display_name || 'Instructor'}
                                </p>
                                <p className="text-xs text-gray-500">{course.instructor?.first_name} {course.instructor?.last_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diff Summary Banner */}
            {hasDiff && diff && (
                <DiffSummaryBanner diff={diff} showDiffView={showDiffView} onToggle={() => setShowDiffView(!showDiffView)} />
            )}

            {/* Course-level field changes */}
            {hasDiff && diff && showDiffView && diff.courseChanges.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                        <ArrowsRightLeftIcon className="h-4 w-4" />
                        Cambios en datos generales del curso
                    </h3>
                    <div className="space-y-1">
                        {diff.courseChanges.map((change) => (
                            <FieldChangeRow key={change.field} change={change} />
                        ))}
                    </div>
                </div>
            )}

            {/* Contenido (Syllabus) */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpenIcon className="h-6 w-6 text-blue-500" />
                Contenido del Curso
            </h2>

            <div className="space-y-4 mb-8">
                {hasDiff && diff && showDiffView ? (
                    // ── Diff-aware rendering ─────────────────────────────
                    diff.modules.map((dm, idx) => (
                        <DiffModuleItem key={`diff-mod-${idx}`} diffModule={dm} />
                    ))
                ) : (
                    // ── Normal rendering (no diff or final-version view) ─
                    course.modules?.map((mod: any) => (
                        <div key={mod.module_id} className="bg-white dark:bg-[#1E2329] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                    Módulo {mod.module_order_index}: {mod.module_title}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {mod.lessons?.map((lesson: any) => (
                                    <LessonItem key={lesson.lesson_id} lesson={lesson} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Barra de Acciones Fija (o al final) */}
            <div className="flex gap-4 justify-end sticky bottom-6 bg-white/80 dark:bg-[#0A0D12]/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20">
                {isRejected ? (
                    <>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <TrashIcon className="h-5 w-5" />
                            Eliminar
                        </button>
                        <button
                            onClick={handleReconsider}
                            className="px-6 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Reconsiderar
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setShowRejectModal(true)}
                        className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <XCircleIcon className="h-5 w-5" />
                        Rechazar Curso
                    </button>
                )}

                <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg shadow-green-600/20 transition-all hover:scale-105 flex items-center gap-2"
                >
                    <CheckCircleIcon className="h-5 w-5" />
                    {isRejected ? 'Aprobar' : 'Aprobar y Publicar'}
                </button>
            </div>

            {/* Modales */}
            <ConfirmationModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
                title="Confirmar Publicación"
                message="¿Estás seguro de publicar este curso? Será visible inmediatamente para los estudiantes."
                confirmText="Sí, Publicar"
                cancelText="Cancelar"
                type="success"
            />
            <ConfirmationModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                title="Rechazar Curso"
                message="Esta acción no se puede deshacer fácilmente. El curso pasará a estado 'rejected'."
                confirmText="Sí, Rechazar"
                cancelText="Cancelar"
                type="danger"
            />
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Eliminar Curso"
                message="¿Estás seguro de que deseas eliminar permanentemente este curso? Esta acción no se puede deshacer."
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

        </div>
    )
}

function LessonItem({ lesson }: { lesson: any }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'activities' | 'materials'>('summary')

    return (
        <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex items-center gap-3"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <PlayCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{lesson.lesson_title}</h4>
                    <p className="text-xs text-gray-500">{lesson.duration_seconds} seg • {lesson.video_provider}</p>
                </div>
                {/* Indicadores de contenido */}
                <div className="flex gap-2 mr-4">
                    {lesson.transcript_content && <span title="Transcripción" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">T</span>}
                    {lesson.summary_content && <span title="Resumen" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">R</span>}
                    {lesson.activities?.length > 0 && <span title="Actividades" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">A:{lesson.activities.length}</span>}
                </div>
                <ChevronLeftIcon className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
            </div>

            {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-100 dark:border-gray-800">
                    {/* Video Preview */}
                    <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeID(lesson.video_provider_id || '')}`}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Resumen</button>
                        <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Transcripción</button>
                        <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activities' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Actividades ({lesson.activities?.length || 0})</button>
                        <button onClick={() => setActiveTab('materials')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Materiales ({lesson.materials?.length || 0})</button>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-[#1E2329] p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[150px]">
                        {activeTab === 'summary' && (
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                {lesson.summary_content ? lesson.summary_content : <p className="text-gray-400 italic">No hay resumen disponible.</p>}
                            </div>
                        )}
                        {activeTab === 'transcript' && (
                            <div className="h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {lesson.transcript_content || 'No hay transcripción disponible.'}
                            </div>
                        )}
                        {activeTab === 'activities' && (
                            <div className="space-y-4">
                                {lesson.activities?.length > 0 ? lesson.activities.map((act: any) => (
                                    <ActivityItem key={act.activity_id} activity={act} />
                                )) : <p className="text-gray-400 italic">No hay actividades creadas.</p>}
                            </div>
                        )}
                        {activeTab === 'materials' && (
                            <div className="space-y-2">
                                {lesson.materials?.length > 0 ? lesson.materials.map((mat: any) => (
                                    <MaterialItem key={mat.material_id} material={mat} />
                                )) : <p className="text-gray-400 italic">No hay materiales adicionales.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function getYouTubeID(url: string) {
    // Simple parser for demonstration. Enhancements needed for robustness.
    // Assuming the provider_id stored is the ID itself or handle basic URL
    if (!url) return '' // Guardar contra undefined
    if (url.length === 11) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

function ActivityItem({ activity }: { activity: any }) {
    let parsedContent = null
    let error = null

    try {
        if (typeof activity.activity_content === 'string') {
            parsedContent = JSON.parse(activity.activity_content)
        } else {
            parsedContent = activity.activity_content
        }
    } catch (e) {
        error = 'Error parsing JSON content'
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${activity.activity_type === 'quiz' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        activity.activity_type === 'ai_chat' || activity.activity_type === 'lia_script' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                        {activity.activity_type}
                    </span>
                    <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{activity.activity_title}</h5>
                </div>
            </div>

            <div className="p-4">
                {error ? (
                    <div className="text-red-500 text-xs font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        {error}. Raw: {String(activity.activity_content).substring(0, 100)}...
                    </div>
                ) : (
                    <div className="text-sm">
                        {(activity.activity_type === 'quiz') && <QuizViewer data={parsedContent} />}
                        {(activity.activity_type === 'lia_script' || activity.activity_type === 'ai_chat') && <ScriptViewer data={parsedContent} />}

                        {/* Fallback for other types */}
                        {activity.activity_type !== 'quiz' && activity.activity_type !== 'lia_script' && activity.activity_type !== 'ai_chat' && (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                                {JSON.stringify(parsedContent, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function QuizViewer({ data }: { data: any }) {
    const questions = data?.questions || data?.items
    if (!data || !questions) return <p className="text-gray-400 italic">Datos de Quiz inválidos</p>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700 pb-2">
                <span>Passing Score: {data.passing_score}%</span>
                <span>{questions.length} Preguntas</span>
            </div>

            {questions.map((item: any, idx: number) => (
                <div key={item.id || idx} className="bg-white dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-800">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {idx + 1}. {item.question}
                    </p>
                    <div className="space-y-1 pl-2">
                        {item.options?.map((opt: string, optIdx: number) => {
                            // Check if this option is the correct answer
                            // correct_answer can be index (number) or string value
                            // Support both snake_case (legacy/viewer) and camelCase (standard/editor)
                            const correctAnswer = item.correct_answer !== undefined ? item.correct_answer : item.correctAnswer

                            const isCorrect = (typeof correctAnswer === 'number' && correctAnswer === optIdx) ||
                                (correctAnswer === opt)

                            return (
                                <div key={optIdx} className={`flex items-center gap-2 text-xs ${isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {isCorrect ? <CheckCircleIcon className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600" />}
                                    <span>{opt}</span>
                                </div>
                            )
                        })}
                    </div>
                    {item.explanation && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                            <span className="font-bold">Explicación:</span> {item.explanation}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function ScriptViewer({ data }: { data: any }) {
    if (!data || !data.scenes) return <p className="text-gray-400 italic">Datos de Script inválidos</p>

    return (
        <div className="space-y-4">
            {data.introduction && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-200 italic mb-4">
                    "{data.introduction}"
                </div>
            )}

            <div className="space-y-3">
                {data.scenes.map((scene: any, idx: number) => (
                    <div key={idx} className={`flex gap-3 ${scene.character === 'Usuario' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${scene.character === 'Lia' ? 'bg-purple-500' : 'bg-gray-500'
                            }`}>
                            {scene.character?.[0] || '?'}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${scene.character === 'Usuario'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-tr-none'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                            }`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs opacity-70">{scene.character}</span>
                                {scene.emotion && <span className="text-[10px] uppercase tracking-wide opacity-50 border border-current px-1 rounded">{scene.emotion}</span>}
                            </div>
                            <p>{scene.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {data.conclusion && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500 text-sm text-green-900 dark:text-green-100">
                    <span className="font-bold">Conclusión:</span> {data.conclusion}
                </div>
            )}
        </div>
    )
}

function MaterialItem({ material }: { material: any }) {
    // If it's a simple link/file
    if (!material.material_type || (material.material_type !== 'quiz' && material.material_type !== 'interactive')) {
        return (
            <a href={material.file_url || material.external_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 transition-colors group">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{material.material_title}</span>
                <span className="text-xs ml-auto text-gray-400 uppercase">{material.material_type || 'archivo'}</span>
            </a>
        )
    }

    // Interactive content (Quiz)
    let parsedContent = null
    let error = null

    try {
        if (typeof material.content_data === 'string') {
            parsedContent = JSON.parse(material.content_data)
        } else {
            parsedContent = material.content_data
        }
    } catch (e) {
        error = 'Error parsing content'
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${material.material_type === 'quiz' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                        {material.material_type}
                    </span>
                    <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{material.material_title}</h5>
                </div>
            </div>

            <div className="p-4">
                {error ? (
                    <div className="text-red-500 text-xs font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        {error}
                    </div>
                ) : (
                    <div className="text-sm">
                        {(material.material_type === 'quiz') && <QuizViewer data={parsedContent} />}
                        {/* Add support for other interactive materials here */}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIFF COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const diffColors: Record<DiffStatus, { bg: string; text: string; border: string; label: string }> = {
    added:     { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-400 dark:border-green-600', label: 'Nuevo' },
    removed:   { bg: 'bg-red-100 dark:bg-red-900/20',     text: 'text-red-700 dark:text-red-400',     border: 'border-red-400 dark:border-red-600',   label: 'Eliminado' },
    modified:  { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-400 dark:border-yellow-600', label: 'Modificado' },
    unchanged: { bg: '', text: 'text-gray-400', border: 'border-transparent', label: '' },
}

function DiffBadge({ status }: { status: DiffStatus }) {
    if (status === 'unchanged') return null
    const c = diffColors[status]
    const Icon = status === 'added' ? PlusCircleIcon : status === 'removed' ? MinusCircleIcon : ArrowsRightLeftIcon
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>
            <Icon className="h-3 w-3" />
            {c.label}
        </span>
    )
}

function DiffSummaryBanner({ diff, showDiffView, onToggle }: { diff: CourseDiff; showDiffView: boolean; onToggle: () => void }) {
    const { summary } = diff
    const totalChanges = summary.modulesAdded + summary.modulesRemoved + summary.modulesModified +
                         summary.lessonsAdded + summary.lessonsRemoved + summary.lessonsModified

    return (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <ArrowsRightLeftIcon className="h-5 w-5" />
                    Resumen de Cambios ({totalChanges} {totalChanges === 1 ? 'cambio' : 'cambios'})
                </h3>
                <button
                    onClick={onToggle}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                    {showDiffView ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    {showDiffView ? 'Ver Versión Final' : 'Ver Cambios'}
                </button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
                {summary.modulesAdded > 0 && (
                    <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <PlusCircleIcon className="h-4 w-4" /> {summary.modulesAdded} {summary.modulesAdded === 1 ? 'módulo nuevo' : 'módulos nuevos'}
                    </span>
                )}
                {summary.modulesRemoved > 0 && (
                    <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
                        <MinusCircleIcon className="h-4 w-4" /> {summary.modulesRemoved} {summary.modulesRemoved === 1 ? 'módulo eliminado' : 'módulos eliminados'}
                    </span>
                )}
                {summary.modulesModified > 0 && (
                    <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                        <ArrowsRightLeftIcon className="h-4 w-4" /> {summary.modulesModified} {summary.modulesModified === 1 ? 'módulo modificado' : 'módulos modificados'}
                    </span>
                )}
                {summary.lessonsAdded > 0 && (
                    <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                        <PlusCircleIcon className="h-4 w-4" /> {summary.lessonsAdded} {summary.lessonsAdded === 1 ? 'lección nueva' : 'lecciones nuevas'}
                    </span>
                )}
                {summary.lessonsRemoved > 0 && (
                    <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
                        <MinusCircleIcon className="h-4 w-4" /> {summary.lessonsRemoved} {summary.lessonsRemoved === 1 ? 'lección eliminada' : 'lecciones eliminadas'}
                    </span>
                )}
                {summary.lessonsModified > 0 && (
                    <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                        <ArrowsRightLeftIcon className="h-4 w-4" /> {summary.lessonsModified} {summary.lessonsModified === 1 ? 'lección modificada' : 'lecciones modificadas'}
                    </span>
                )}
                {totalChanges === 0 && (
                    <span className="text-gray-500">Sin cambios detectados en la estructura del curso.</span>
                )}
            </div>
        </div>
    )
}

const fieldLabels: Record<string, string> = {
    title: 'Título',
    description: 'Descripción',
    level: 'Nivel',
    category: 'Categoría',
    thumbnail_url: 'Imagen',
    module_title: 'Título del módulo',
    lesson_title: 'Título de la lección',
    video_provider_id: 'Video',
    duration_seconds: 'Duración (seg)',
    transcript_content: 'Transcripción',
    summary_content: 'Resumen',
}

function FieldChangeRow({ change }: { change: FieldChange }) {
    const label = fieldLabels[change.field] || change.field
    const isLongText = (typeof change.oldValue === 'string' && change.oldValue.length > 80) ||
                       (typeof change.newValue === 'string' && change.newValue.length > 80)

    const truncate = (val: any) => {
        if (val === null || val === undefined) return '(vacío)'
        const str = String(val)
        return str.length > 100 ? str.substring(0, 100) + '…' : str
    }

    return (
        <div className="flex items-start gap-2 text-xs">
            <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[100px] shrink-0">{label}:</span>
            <span className="line-through text-red-500 dark:text-red-400">{truncate(change.oldValue)}</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600 dark:text-green-400 font-medium">{truncate(change.newValue)}</span>
        </div>
    )
}

function DiffModuleItem({ diffModule }: { diffModule: DiffModule }) {
    const c = diffColors[diffModule.status]
    const isRemoved = diffModule.status === 'removed'

    return (
        <div className={`rounded-xl border-l-4 ${c.border} overflow-hidden ${isRemoved ? 'opacity-60' : ''}`}>
            <div className={`bg-white dark:bg-[#1E2329] rounded-r-xl border border-l-0 border-gray-200 dark:border-gray-700 overflow-hidden`}>
                <div className={`bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <h3 className={`font-semibold ${isRemoved ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {diffModule.module_title}
                        </h3>
                        <DiffBadge status={diffModule.status} />
                    </div>
                    {diffModule.original_title && (
                        <span className="text-xs text-gray-400 italic">antes: {diffModule.original_title}</span>
                    )}
                </div>

                {/* Module-level field changes */}
                {diffModule.changes.length > 0 && (
                    <div className="px-6 py-2 bg-yellow-50/50 dark:bg-yellow-900/5 border-b border-gray-100 dark:border-gray-800">
                        {diffModule.changes.map((ch) => (
                            <FieldChangeRow key={ch.field} change={ch} />
                        ))}
                    </div>
                )}

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {diffModule.lessons.map((dl, idx) => (
                        <DiffLessonItem key={`diff-les-${idx}`} diffLesson={dl} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function DiffLessonItem({ diffLesson }: { diffLesson: DiffLesson }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'activities' | 'materials'>('summary')
    const c = diffColors[diffLesson.status]
    const isRemoved = diffLesson.status === 'removed'
    const displayLesson = diffLesson.proposed ?? diffLesson.original

    if (!displayLesson) return null

    return (
        <div className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${isRemoved ? 'opacity-60' : ''}`}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex items-center gap-3 ${c.bg}`}
            >
                <div className={`p-2 rounded-lg ${diffLesson.status === 'added' ? 'bg-green-100 dark:bg-green-900/30' : diffLesson.status === 'removed' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                    <PlayCircleIcon className={`h-5 w-5 ${diffLesson.status === 'added' ? 'text-green-600 dark:text-green-400' : diffLesson.status === 'removed' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>
                <div className="flex-1">
                    <h4 className={`font-medium ${isRemoved ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {diffLesson.lesson_title}
                    </h4>
                    {diffLesson.original_title && (
                        <p className="text-[10px] text-gray-400 italic">antes: {diffLesson.original_title}</p>
                    )}
                    <p className="text-xs text-gray-500">{displayLesson.duration_seconds} seg • {displayLesson.video_provider}</p>
                </div>
                <DiffBadge status={diffLesson.status} />
                <ChevronLeftIcon className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
            </div>

            {isExpanded && !isRemoved && (
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-100 dark:border-gray-800">
                    {/* Field-level changes for this lesson */}
                    {diffLesson.changes.length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Cambios en esta lección:</p>
                            {diffLesson.changes.map((ch) => (
                                <FieldChangeRow key={ch.field} change={ch} />
                            ))}
                        </div>
                    )}

                    {/* Video Preview */}
                    <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeID(displayLesson.video_provider_id || '')}`}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Resumen</button>
                        <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Transcripción</button>
                        <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activities' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Actividades ({displayLesson.activities?.length || 0})</button>
                        <button onClick={() => setActiveTab('materials')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Materiales ({displayLesson.materials?.length || 0})</button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white dark:bg-[#1E2329] p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[150px]">
                        {activeTab === 'summary' && (
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                {displayLesson.summary_content ? displayLesson.summary_content : <p className="text-gray-400 italic">No hay resumen disponible.</p>}
                            </div>
                        )}
                        {activeTab === 'transcript' && (
                            <div className="h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {displayLesson.transcript_content || 'No hay transcripción disponible.'}
                            </div>
                        )}
                        {activeTab === 'activities' && (
                            <div className="space-y-4">
                                {displayLesson.activities?.length > 0 ? displayLesson.activities.map((act: any) => (
                                    <ActivityItem key={act.activity_id} activity={act} />
                                )) : <p className="text-gray-400 italic">No hay actividades creadas.</p>}
                            </div>
                        )}
                        {activeTab === 'materials' && (
                            <div className="space-y-2">
                                {displayLesson.materials?.length > 0 ? displayLesson.materials.map((mat: any) => (
                                    <MaterialItem key={mat.material_id} material={mat} />
                                )) : <p className="text-gray-400 italic">No hay materiales adicionales.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
