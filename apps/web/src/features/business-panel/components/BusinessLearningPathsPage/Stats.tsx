import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Route, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BusinessLearningPathsLogic } from './types'

export function BusinessLearningPathStats({ logic }: { logic: BusinessLearningPathsLogic }) {
  const { t } = useTranslation('business')
  const { primaryColor, accentColor, textColor, mutedTextColor, borderColor, inputBg } = logic.theme
  const stats = [
    { icon: Route, label: t('learningPathsPage.stats.paths'), value: logic.learningPaths.length },
    { icon: BookOpen, label: t('learningPathsPage.stats.workshops'), value: logic.totalWorkshops },
    { icon: Users, label: t('learningPathsPage.stats.assignedUsers'), value: logic.totalAssignedUsers },
    { icon: CheckCircle2, label: t('learningPathsPage.stats.activeAssignments'), value: logic.assignments.length },
  ]

  return (
    <div id="tour-paths-stats" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="flex items-center gap-4 rounded-[1.5rem] border p-5" style={{ backgroundColor: inputBg, borderColor }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 12.5%, transparent), color-mix(in srgb, ${accentColor} 12.5%, transparent))`, color: primaryColor }}>
              <Icon className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: mutedTextColor }}>{stat.label}</p>
              <p className="text-2xl font-black leading-none mt-1" style={{ color: textColor }}>{stat.value}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
