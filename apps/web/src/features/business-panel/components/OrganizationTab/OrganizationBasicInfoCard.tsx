import { motion } from 'framer-motion'
import { Building2, Globe, Mail, Users } from 'lucide-react'
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
        <MaxUsersField form={form} theme={theme} />
      </div>
    </motion.div>
  )
}

function MaxUsersField({ form, theme }: OrganizationSectionProps) {
  return (
    <div>
      <label htmlFor="max_users" className="block text-sm font-medium mb-2" style={{ color: theme.textColor }}>
        <span className="flex items-center gap-2"><Users className="w-4 h-4" />Limite de usuarios</span>
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          id="max_users"
          name="max_users"
          value={form.formData.max_users}
          onChange={form.handleChange}
          min="1"
          className="flex-1 px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          placeholder="10"
        />
        <span className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}>usuarios</span>
      </div>
    </div>
  )
}
