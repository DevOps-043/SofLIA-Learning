'use client'

import { BookOpen, Plus } from 'lucide-react'
import { NodeCourseCard } from './NodeCourseCard'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

export function NodeLearningTab(props: NodeDashboardCommonProps) {
  const { state, t } = props
  const courses = state.data?.courses || []
  return (
    <div className="space-y-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-white">{t('hierarchy.dashboard.learning.title')}</h3><p className="text-sm text-white/40">{t('hierarchy.dashboard.learning.subtitle')}</p></div><button onClick={() => state.setShowAssignmentModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"><Plus className="h-4 w-4" />{t('hierarchy.dashboard.learning.assign')}</button></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{courses.length === 0 ? <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1E2329] py-20 text-center"><BookOpen className="mb-4 h-16 w-16 text-white/10" /><p className="font-medium text-white/40">{t('hierarchy.dashboard.learning.empty')}</p></div> : courses.map((course) => <NodeCourseCard key={course.assignment_id} {...props} course={course} />)}<button onClick={() => state.setShowAssignmentModal(true)} className="group flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 transition-colors hover:bg-white/5"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A3038] text-white/40 transition-all group-hover:bg-blue-600 group-hover:text-white"><Plus className="h-6 w-6" /></div><span className="font-medium text-white/40 transition-colors group-hover:text-white">{t('hierarchy.dashboard.learning.assignNew')}</span></button></div></div>
  )
}
