import { motion } from 'framer-motion'
import { Check, Copy, Mail } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import type { OrganizationSectionProps } from './types'

export function OrganizationContactCard({ form, theme }: OrganizationSectionProps) {
  const cardStyle = { backgroundColor: theme.cardBg, borderColor: theme.borderColor }
  const inputStyle = { backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-6 border space-y-5"
      style={cardStyle}
    >
      <SectionHeader icon={Mail} title="Informacion de Contacto" description="Datos de contacto de tu organizacion" theme={theme} />
      <div className="space-y-4">
        {[
          { label: 'Nombre de Contacto', value: form.formData.name, field: 'name' },
          { label: 'Descripcion', value: form.formData.description || '', field: 'description' },
          { label: 'Email de Contacto', value: form.formData.contact_email || '', field: 'email' },
        ].map((item) => (
          <div key={item.field}>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>{item.label}</label>
            <div className="flex gap-2">
              <input type="text" value={item.value} readOnly className="flex-1 px-4 py-3 rounded-xl border-2 cursor-default" style={inputStyle} />
              <CopyButton copied={Boolean(form.copiedFields[item.field])} onClick={() => form.copyToClipboard(item.value, item.field)} theme={theme} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function CopyButton({ copied, onClick, theme }: { copied: boolean; onClick: () => void; theme: OrganizationSectionProps['theme'] }) {
  const Icon = copied ? Check : Copy
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg"
      style={{ backgroundColor: copied ? theme.successColor : theme.actionColor, color: theme.onActionColor, boxShadow: `0 6px 18px ${copied ? theme.successColor : theme.actionColor}33` }}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
    </motion.button>
  )
}
