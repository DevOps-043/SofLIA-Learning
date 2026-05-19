import { motion } from 'framer-motion'
import { Check, Copy, Mail } from 'lucide-react'
import { SectionHeader } from './FormField'
import type { OrganizationFormState, OrganizationTabStyles, OrganizationTabTheme } from './types'

export function OrganizationContactSection({ formState, styles, theme }: {
  formState: OrganizationFormState
  styles: OrganizationTabStyles
  theme: OrganizationTabTheme
}) {
  const items = [
    { label: 'Nombre de Contacto', value: formState.formData.name, field: 'name' },
    { label: 'Descripción', value: formState.formData.description || '', field: 'description' },
    { label: 'Email de Contacto', value: formState.formData.contact_email || '', field: 'email' },
  ]

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl p-6 border space-y-5" style={styles.cardStyle}>
      <SectionHeader description="Datos de contacto de tu organización" icon={<Mail className="w-5 h-5" />} title="Información de Contacto" theme={theme} styles={styles} />
      <div className="space-y-4">
        {items.map((item) => <CopyField key={item.field} item={item} formState={formState} styles={styles} theme={theme} />)}
      </div>
    </motion.div>
  )
}

function CopyField({ item, formState, styles, theme }: {
  item: { label: string; value: string; field: string }
  formState: OrganizationFormState
  styles: OrganizationTabStyles
  theme: OrganizationTabTheme
}) {
  const copied = formState.copiedFields[item.field]
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={styles.labelStyle}>{item.label}</label>
      <div className="flex gap-2">
        <input type="text" value={item.value} readOnly className="flex-1 px-4 py-3 rounded-xl border-2 cursor-default" style={styles.inputStyle} />
        <motion.button type="button" onClick={() => formState.copyToClipboard(item.value, item.field)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg" style={{ backgroundColor: copied ? theme.successColor : theme.actionColor, color: copied ? 'var(--color-bg-light)' : theme.onActionColor, boxShadow: '0 6px 18px ' + (copied ? theme.successColor : theme.actionColor) + '33' }}>
          {copied ? <><Check className="w-4 h-4" /><span className="hidden sm:inline">Copiado</span></> : <><Copy className="w-4 h-4" /><span className="hidden sm:inline">Copiar</span></>}
        </motion.button>
      </div>
    </div>
  )
}
