'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import {
  X, UserCheck, Building, BookOpen, Clock, Award, Calendar,
  ChevronDown, ChevronRight, CheckCircle, Circle, PlayCircle, Lock,
  GraduationCap, Video, FileQuestion
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UserDetail, UserProgressResponse, UserCourseProgress, UserLessonDetail } from './types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

interface UserProgressModalProps {
  user: UserDetail
  isOpen: boolean
  onClose: () => void
}

export function UserProgressModal({ user, isOpen, onClose }: UserProgressModalProps) {
  const { data, isLoading } = useSWR<UserProgressResponse>(
    isOpen ? `/api/admin/user-stats/users/${user.id}/progress` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl transition-all">
                <div className="flex flex-col md:flex-row max-h-[85vh]">
                  {/* Left Panel - User Info */}
                  <div className="w-full md:w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-900 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
                    {/* Close button (mobile) */}
                    <div className="flex justify-end md:hidden mb-2">
                      <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex flex-col items-center text-center mb-6">
                      {user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="" className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-blue-500/50" />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 ring-2 ring-blue-500/50">
                          <UserCheck className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.displayName || user.username}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>

                    {/* Org info */}
                    {user.organization && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-none">
                        <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{user.organization}</p>
                          {user.orgRole && <p className="text-xs text-gray-500 dark:text-gray-400">{user.orgRole}</p>}
                        </div>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="space-y-3">
                      <SidebarStat icon={BookOpen} label="Cursos inscritos" value={String(user.coursesEnrolled)} />
                      <SidebarStat icon={GraduationCap} label="Progreso promedio" value={`${user.avgProgress}%`} />
                      <SidebarStat icon={Clock} label="Horas de estudio" value={`${user.studyHours}h`} />
                      <SidebarStat icon={Award} label="Certificados" value={String(user.certificates)} />
                      <SidebarStat icon={Calendar} label="Último login" value={formatDate(user.lastLogin)} />
                    </div>
                  </div>

                  {/* Right Panel - Course Progress */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Progreso por Curso</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {data?.courses?.length ?? 0} curso{(data?.courses?.length ?? 0) !== 1 ? 's' : ''} inscrito{(data?.courses?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button onClick={onClose} className="hidden md:flex p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                      ) : data?.courses && data.courses.length > 0 ? (
                        data.courses.map(course => (
                          <CourseCard key={course.enrollmentId} course={course} formatDate={formatDate} />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                          <BookOpen className="w-12 h-12 mb-3 opacity-50" />
                          <p>Este usuario no tiene cursos inscritos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

function SidebarStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-none">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-blue-500/20 text-blue-300', label: 'En curso' },
  completed: { color: 'bg-green-500/20 text-green-300', label: 'Completado' },
  paused: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Pausado' },
  cancelled: { color: 'bg-red-500/20 text-red-300', label: 'Cancelado' },
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

function CourseCard({ course, formatDate }: { course: UserCourseProgress; formatDate: (d: string | null) => string }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[course.enrollmentStatus] || STATUS_CONFIG.active
  const studyHours = Math.round((course.totalStudyMinutes / 60) * 10) / 10
  const completedLessons = course.lessons.filter(l => l.status === 'completed').length

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
      {/* Course Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-12 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Title & badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{course.courseTitle}</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{LEVEL_LABELS[course.courseLevel] || course.courseLevel}</span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(course.overallProgress, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                />
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white w-10 text-right">{course.overallProgress}%</span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Inscrito: {formatDate(course.enrolledAt)}
              </span>
              {course.completedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Completado: {formatDate(course.completedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {studyHours}h de estudio
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {completedLessons}/{course.lessons.length} lecciones
              </span>
              {course.hasCertificate && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Award className="w-3 h-3" />
                  Certificado ({formatDate(course.certificateIssuedAt)})
                </span>
              )}
            </div>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0 mt-1">
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Lessons (expandable) */}
      <AnimatePresence>
        {expanded && course.lessons.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-3 space-y-2">
              {course.lessons.map((lesson, idx) => (
                <LessonRow key={lesson.lessonId} lesson={lesson} index={idx + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty lessons state */}
      {expanded && course.lessons.length === 0 && (
        <div className="border-t border-gray-200 dark:border-gray-600 px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin datos de lecciones disponibles
        </div>
      )}
    </div>
  )
}

const LESSON_STATUS_ICON: Record<string, { icon: LucideIcon; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-green-400' },
  in_progress: { icon: PlayCircle, color: 'text-blue-400' },
  not_started: { icon: Circle, color: 'text-gray-500' },
  locked: { icon: Lock, color: 'text-gray-600' },
}

function LessonRow({ lesson, index }: { lesson: UserLessonDetail; index: number }) {
  const statusCfg = LESSON_STATUS_ICON[lesson.status] || LESSON_STATUS_ICON.not_started
  const StatusIcon = statusCfg.icon

  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors">
      {/* Status icon */}
      <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusCfg.color}`} />

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white truncate">
          <span className="text-gray-400 dark:text-gray-500 mr-1">{index}.</span>
          {lesson.lessonTitle}
        </p>
      </div>

      {/* Video progress */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 w-20">
        <Video className="w-3 h-3" />
        <span>{lesson.videoProgress}%</span>
      </div>

      {/* Quiz status */}
      <div className="flex items-center gap-1 text-xs w-16">
        {lesson.quizCompleted ? (
          <span className={lesson.quizPassed ? 'text-green-400' : 'text-red-400'}>
            <FileQuestion className="w-3 h-3 inline mr-1" />
            {lesson.quizPassed ? 'OK' : 'Fail'}
          </span>
        ) : (
          <span className="text-gray-500">
            <FileQuestion className="w-3 h-3 inline mr-1" />
            —
          </span>
        )}
      </div>

      {/* Time */}
      <div className="text-xs text-gray-500 dark:text-gray-400 w-14 text-right">
        {lesson.timeSpentMinutes > 0 ? `${lesson.timeSpentMinutes}m` : '—'}
      </div>
    </div>
  )
}
