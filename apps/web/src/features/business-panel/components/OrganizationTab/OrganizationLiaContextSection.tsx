import { motion } from 'framer-motion'
import { Brain, MapPin, Users } from 'lucide-react'
import { SelectField, TextField } from './FormFields'
import { COMPANY_SIZE_OPTIONS, COMPANY_TYPE_OPTIONS, INDUSTRY_OPTIONS } from './lia-context-options'
import { SectionHeader } from './SectionHeader'
import { TextAreaField } from './TextAreaField'
import type { OrganizationSectionProps } from './types'

export function OrganizationLiaContextSection({ form, theme }: OrganizationSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl p-6 border space-y-5"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <SectionHeader
        icon={Brain}
        title="Contexto para SofLIA"
        description="Esta informacion permite a SofLIA adaptar sus respuestas al perfil real de tu empresa"
        theme={theme}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Giro / Sector de la Empresa" name="industry" value={form.formData.industry} onChange={form.handleChange} options={INDUSTRY_OPTIONS} placeholder="Selecciona un sector..." theme={theme} />
        <SelectField icon={<Users className="w-4 h-4" />} label="Tamano de la Empresa" name="company_size" value={form.formData.company_size} onChange={form.handleChange} options={COMPANY_SIZE_OPTIONS} placeholder="Selecciona un rango..." theme={theme} />
        <SelectField label="Tipo de Empresa" name="company_type" value={form.formData.company_type} onChange={form.handleChange} options={COMPANY_TYPE_OPTIONS} placeholder="Selecciona un tipo..." theme={theme} />
        <TextField icon={<MapPin className="w-4 h-4" />} label="Pais de Operacion" name="company_country" value={form.formData.company_country} onChange={form.handleChange} placeholder="Mexico, Colombia, Espana..." theme={theme} />
      </div>
      <TextAreaField
        label="Mision / Proposito de la Empresa"
        name="company_mission"
        value={form.formData.company_mission}
        onChange={form.handleChange}
        rows={3}
        maxLength={500}
        placeholder="Describe la mision o proposito central de tu empresa..."
        help="SofLIA usara esta informacion para contextualizar ejemplos, actividades y recomendaciones a la realidad de tu empresa."
        theme={theme}
      />
    </motion.div>
  )
}
