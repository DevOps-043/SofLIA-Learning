import { motion } from 'framer-motion'
import { ChevronRight, Film, Layers, Lock, Sparkles, Users } from 'lucide-react'
import type { BusinessLearningPathItem, BusinessLearningPathsLogic, BusinessLearningPathsTranslate } from './types'

interface BusinessLearningPathCardProps {
  path: BusinessLearningPathItem
  index: number
  logic: BusinessLearningPathsLogic
  t: BusinessLearningPathsTranslate
  onOpenVideos: (id: string) => void
}

export function BusinessLearningPathCard({ path, index, logic, t, onOpenVideos }: BusinessLearningPathCardProps) {
  const { primaryColor, onPrimaryColor, accentColor, textColor, mutedTextColor, borderColor, inputBg, panelBg } = logic.theme
  const assignedCount = logic.assignmentsByPathId.get(path.id)?.length ?? 0
  const defaultRulesCount = logic.defaultRulesByPathId.get(path.id)?.length ?? 0
  return (
    <motion.article key={path.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="flex flex-col overflow-hidden rounded-[2rem] border" style={{ backgroundColor: inputBg, borderColor }}>
      <div className="p-6 pb-4 border-b" style={{ borderColor }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)`, color: primaryColor }}>
            <Layers className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider" style={{ backgroundColor: panelBg, borderColor, color: mutedTextColor }}>
            {path.item_count} {path.item_count === 1 ? 'taller' : 'talleres'}
          </div>
        </div>
        {defaultRulesCount > 0 ? (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider" style={{ backgroundColor: `${accentColor}14`, borderColor: `${accentColor}35`, color: accentColor }}>
            <Sparkles className="h-3 w-3" />{t('learningPathsPage.defaults.badge', { count: defaultRulesCount })}
          </div>
        ) : null}
        <h2 className="text-base font-black leading-snug mb-1" style={{ color: textColor }}>{path.title}</h2>
        {path.description && <p className="text-xs line-clamp-2" style={{ color: mutedTextColor }}>{path.description}</p>}
      </div>
      {path.items.length > 0 && (
        <div className="px-6 py-4 space-y-2 border-b flex-1" style={{ borderColor }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: mutedTextColor }}>Contenido</p>
          {path.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 rounded-2xl border px-4 py-2.5" style={{ backgroundColor: panelBg, borderColor }}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[9px] font-black" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>{item.position}</span>
              <p className="truncate text-xs font-medium" style={{ color: textColor }}>{item.course?.title ?? 'Taller sin título'}</p>
              {item.position === 1 ? null : <Lock className="ml-auto h-3 w-3 shrink-0 opacity-30" style={{ color: textColor }} />}
            </div>
          ))}
          {path.items.length > 3 && <p className="pl-2 text-xs" style={{ color: mutedTextColor }}>+{path.items.length - 3} más</p>}
        </div>
      )}
      <div className="p-5 flex flex-col gap-2.5">
        <p className="text-xs" style={{ color: mutedTextColor }}>{assignedCount} {assignedCount === 1 ? 'usuario asignado' : 'usuarios asignados'}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onOpenVideos(path.id)} className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ backgroundColor: panelBg, borderColor, color: mutedTextColor }}>
            <Film className="h-3.5 w-3.5" />{t('learningPathsPage.introVideos.manageVideos')}
          </button>
          <button type="button" onClick={() => logic.setDefaultConfigLearningPathId(path.id)} className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ backgroundColor: panelBg, borderColor, color: mutedTextColor }}>
            <Sparkles className="h-3.5 w-3.5" />{t('learningPathsPage.defaults.configure')}
          </button>
          <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => logic.setSelectedLearningPathId(path.id)} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-lg transition-all" style={{ backgroundColor: primaryColor, color: onPrimaryColor }}>
            <Users className="h-3.5 w-3.5" />Asignar<ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
