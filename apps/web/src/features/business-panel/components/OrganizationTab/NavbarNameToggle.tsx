import { motion } from 'framer-motion'
import { Type } from 'lucide-react'
import type { OrganizationSectionProps } from './types'

export function NavbarNameToggle({ form, theme }: OrganizationSectionProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
          <Type className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.textColor }}>Mostrar nombre en navbar</p>
          <p className="text-xs" style={{ color: theme.subtextColor }}>Ocultalo si el logo ya incluye el nombre</p>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={() => form.setFormData((prev) => ({ ...prev, show_navbar_name: !prev.show_navbar_name }))}
        whileTap={{ scale: 0.95 }}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: form.formData.show_navbar_name ? theme.actionColor : theme.hoverBg }}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
          style={{ marginLeft: 4, translateX: form.formData.show_navbar_name ? 18 : 0 }}
        />
      </motion.button>
    </div>
  )
}
