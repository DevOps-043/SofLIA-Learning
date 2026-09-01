import { motion } from 'framer-motion'
import { Building2, Globe, Mail } from 'lucide-react'
import { TextField } from './FormFields'
import { NavbarNameToggle } from './NavbarNameToggle'
import { SectionHeader } from './SectionHeader'
import { TextAreaField } from './TextAreaField'
import type { OrganizationSectionProps } from './types'

export function OrganizationBasicInfoCard({ form, theme }: OrganizationSectionProps) {
  const cardStyle = { backgroundColor: theme.cardBg, borderColor: theme.borderColor }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-6 border space-y-5"
      style={cardStyle}
    >
      <SectionHeader icon={Building2} title="Informacion Basica" description="Datos principales de tu empresa" theme={theme} />
      <div className="space-y-4">
        <TextField label="Nombre de la Empresa *" name="name" value={form.formData.name} onChange={form.handleChange} required placeholder="Nombre de tu empresa" theme={theme} />
        <NavbarNameToggle form={form} theme={theme} />
        <TextAreaField label="Descripcion" name="description" value={form.formData.description} onChange={form.handleChange} rows={4} maxLength={500} placeholder="Describe tu empresa..." theme={theme} />
        <TextField icon={<Mail className="w-4 h-4" />} label="Email de Contacto" name="contact_email" type="email" value={form.formData.contact_email} onChange={form.handleChange} placeholder="contacto@empresa.com" theme={theme} />
        <TextField icon={<Globe className="w-4 h-4" />} label="Sitio Web" name="website_url" type="url" value={form.formData.website_url} onChange={form.handleChange} placeholder="https://www.empresa.com" theme={theme} />
      </div>
    </motion.div>
  )
}
