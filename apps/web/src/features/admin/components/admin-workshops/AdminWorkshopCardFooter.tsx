'use client'

import { motion } from 'framer-motion'
import { Eye, Pencil, Trash2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { useMotionSafe } from '@/lib/utils/motion'

interface AdminWorkshopCardFooterProps {
  studentCount: number
  index: number
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AdminWorkshopCardFooter(props: AdminWorkshopCardFooterProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const { disableHeavy } = useMotionSafe()
  return (
    <motion.div initial={disableHeavy ? false : { opacity: 0, y: 10 }} animate={disableHeavy ? undefined : { opacity: 1, y: 0 }} transition={disableHeavy ? undefined : { delay: props.index * 0.05 + 0.35 }} className="mt-auto flex items-center justify-between border-t pt-5" style={{ borderColor: theme.dividerColor }}>
      <motion.div whileHover={disableHeavy ? undefined : { scale: 1.05 }} className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: theme.inputBg }}>
        <Users className="h-4 w-4" style={{ color: theme.accentColor }} />
        <span className="text-sm font-semibold" style={{ color: theme.textColor }}>{props.studentCount} <span className="text-xs font-normal" style={{ color: theme.subtextColor }}>{t('workshops.card.studentsLabel')}</span></span>
      </motion.div>
      <div className="flex items-center gap-2 rounded-xl border p-1.5" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
        <AdminWorkshopIconButton icon={Eye} label={tc('actions.viewDetails')} color={theme.subtextColor} onClick={props.onView} />
        <AdminWorkshopIconButton icon={Pencil} label={tc('actions.edit')} color={theme.successColor} onClick={props.onEdit} />
        <AdminWorkshopIconButton icon={Trash2} label={tc('actions.delete')} color={theme.dangerColor} onClick={props.onDelete} />
      </div>
    </motion.div>
  )
}

function AdminWorkshopIconButton(props: {
  icon: typeof Eye
  label: string
  color: string
  onClick: () => void
}) {
  const { disableHeavy } = useMotionSafe()
  const Icon = props.icon
  return (
    <motion.button
      whileHover={disableHeavy ? undefined : { scale: 1.2, y: -2 }}
      whileTap={disableHeavy ? undefined : { scale: 0.9 }}
      onClick={(event) => {
        // La tarjeta contenedora navega a la gestión del curso en su onClick;
        // sin stopPropagation, editar/eliminar también disparaban esa navegación.
        event.stopPropagation()
        props.onClick()
      }}
      className="rounded-lg p-2.5 transition-all duration-300"
      style={{ color: props.color }}
      title={props.label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  )
}
