import { motion } from 'framer-motion'
import { Building2, Globe, Mail, Type } from 'lucide-react'
import { SectionHeader, TextAreaField, TextField } from './FormField'
import type { OrganizationFormState, OrganizationTabStyles, OrganizationTabTheme } from './types'

export function OrganizationBasicInfoSection({ formState, styles, theme }: {
  formState: OrganizationFormState
  styles: OrganizationTabStyles
  theme: OrganizationTabTheme
}) {
  const { formData, handleChange } = formState
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl p-6 border space-y-5" style={styles.cardStyle}>
      <SectionHeader description="Datos principales de tu empresa" icon={<Building2 className="w-5 h-5" />} title="Información Básica" theme={theme} styles={styles} />
      <div className="space-y-4">
        <TextField id="name" name="name" label="Nombre de la Empresa *" value={formData.name} onChange={handleChange} required placeholder="Nombre de tu empresa" styles={styles} />
        <NavbarNameToggle formState={formState} styles={styles} theme={theme} />
        <TextAreaField id="description" name="description" label="Descripción" value={formData.description} onChange={handleChange} rows={4} maxLength={500} placeholder="Describe tu empresa..." theme={theme} styles={styles} />
        <TextField id="contact_email" name="contact_email" type="email" label="Email de Contacto" icon={<Mail className="w-4 h-4" />} value={formData.contact_email} onChange={handleChange} placeholder="contacto@empresa.com" styles={styles} />
        <TextField id="website_url" name="website_url" type="url" label="Sitio Web" icon={<Globe className="w-4 h-4" />} value={formData.website_url} onChange={handleChange} placeholder="https://www.empresa.com" styles={styles} />
      </div>
    </motion.div>
  )
}

function NavbarNameToggle({ formState, styles, theme }: { formState: OrganizationFormState; styles: OrganizationTabStyles; theme: OrganizationTabTheme }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border" style={styles.inputStyle}>
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}><Type className="w-5 h-5" /></div><div><p className="text-sm font-semibold" style={styles.labelStyle}>Mostrar nombre en navbar</p><p className="text-xs" style={styles.helpStyle}>Ocúltalo si el logo ya incluye el nombre</p></div></div>
      <motion.button type="button" onClick={() => formState.setFormData((prev) => ({ ...prev, show_navbar_name: !prev.show_navbar_name }))} whileTap={{ scale: 0.95 }} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none" style={{ backgroundColor: formState.formData.show_navbar_name ? theme.actionColor : theme.hoverBg }}>
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="inline-block h-4 w-4 rounded-full bg-white shadow-sm" style={{ marginLeft: 4, translateX: formState.formData.show_navbar_name ? 18 : 0 }} />
      </motion.button>
    </div>
  )
}
