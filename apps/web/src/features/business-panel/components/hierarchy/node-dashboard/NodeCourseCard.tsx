'use client'

import { UserCheck } from 'lucide-react'
import type { NodeDashboardCommonProps } from './node-dashboard.types'

type NodeCourse = NonNullable<NodeDashboardCommonProps['state']['data']>['courses'][number]

export function NodeCourseCard({ course, state, t }: NodeDashboardCommonProps & { course: NodeCourse }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-carbon-800 transition-colors hover:border-white/10"><div className="relative h-40 bg-gray-700">{course.thumbnail_url ? <img src={course.thumbnail_url} className="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-80" /> : null}<div className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">{course.category}</div></div><div className="p-5"><h4 className="mb-2 line-clamp-2 font-bold text-white">{course.title}</h4><div className="mt-4 flex items-center justify-between"><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'}`}>{course.status === 'active' ? t('hierarchy.dashboard.details.status.active') : t('hierarchy.dashboard.details.status.inactive')}</span><button onClick={() => state.setSelectedCourseForIndividual({ id: course.id, title: course.title })} className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-blue-400" title={t('hierarchy.dashboard.learning.individualAssign')}><UserCheck className="h-4 w-4" /></button></div></div></div>
  )
}
