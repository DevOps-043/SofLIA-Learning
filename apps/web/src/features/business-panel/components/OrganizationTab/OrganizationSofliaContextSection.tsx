import { motion } from 'framer-motion'
import { Brain, MapPin, Users } from 'lucide-react'
import { SectionHeader, TextAreaField } from './FormField'
import type { OrganizationFormState, OrganizationTabStyles, OrganizationTabTheme } from './types'

const industryOptions = ['Tecnología e IT', 'Manufactura e Industria', 'Salud y Farmacéutica', 'Servicios Financieros y Banca', 'Retail y Comercio', 'Educación', 'Logística y Transporte', 'Construcción e Inmobiliaria', 'Alimentos y Bebidas', 'Marketing y Publicidad', 'Consultoría y Servicios Profesionales', 'Energía y Recursos Naturales', 'Telecomunicaciones', 'Turismo y Hospitalidad', 'Gobierno y Sector Público', 'ONG y Sector Social', 'Otro']
const sizeOptions = ['1-10', '11-50', '51-200', '201-1000', '1001-5000', '5000+']
const typeOptions = ['B2B', 'B2C', 'Mixto', 'Pública', 'ONG']

export function OrganizationSofliaContextSection({ formState, styles, theme }: {
  formState: OrganizationFormState
  styles: OrganizationTabStyles
  theme: OrganizationTabTheme
}) {
  const { formData, handleChange } = formState
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="rounded-2xl p-6 border space-y-5" style={styles.cardStyle}>
      <SectionHeader description="Esta información permite a SofLIA adaptar sus respuestas al perfil real de tu empresa" icon={<Brain className="w-5 h-5" />} title="Contexto para SofLIA" theme={theme} styles={styles} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField id="industry" name="industry" label="Giro / Sector de la Empresa" value={formData.industry} placeholder="Selecciona un sector..." options={industryOptions} formState={formState} styles={styles} />
        <SelectField id="company_size" name="company_size" label="Tamaño de la Empresa" icon={<Users className="w-4 h-4" />} value={formData.company_size} placeholder="Selecciona un rango..." options={sizeOptions} formState={formState} styles={styles} />
        <SelectField id="company_type" name="company_type" label="Tipo de Empresa" value={formData.company_type} placeholder="Selecciona un tipo..." options={typeOptions} formState={formState} styles={styles} />
        <div><label htmlFor="company_country" className="block text-sm font-medium mb-2" style={styles.labelStyle}><span className="flex items-center gap-2"><MapPin className="w-4 h-4" />País de Operación</span></label><input type="text" id="company_country" name="company_country" value={formData.company_country} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none" style={styles.inputStyle} placeholder="México, Colombia, España..." /></div>
      </div>
      <TextAreaField id="company_mission" name="company_mission" label="Misión / Propósito de la Empresa" value={formData.company_mission} onChange={handleChange} rows={3} maxLength={500} placeholder="Describe la misión o propósito central de tu empresa..." theme={theme} styles={styles} help="SofLIA usará esta información para contextualizar ejemplos, actividades y recomendaciones a la realidad de tu empresa." />
    </motion.div>
  )
}

function SelectField({ formState, icon, id, label, name, options, placeholder, styles, value }: {
  formState: OrganizationFormState
  icon?: React.ReactNode
  id: string
  label: string
  name: string
  options: string[]
  placeholder: string
  styles: OrganizationTabStyles
  value: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2" style={styles.labelStyle}><span className="flex items-center gap-2">{icon}{label}</span></label>
      <select id={id} name={name} value={value} onChange={formState.handleChange} className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none" style={styles.inputStyle}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{formatOptionLabel(option)}</option>)}
      </select>
    </div>
  )
}

function formatOptionLabel(option: string) {
  const labels: Record<string, string> = { '1-10': '1 – 10 empleados', '11-50': '11 – 50 empleados', '51-200': '51 – 200 empleados', '201-1000': '201 – 1,000 empleados', '1001-5000': '1,001 – 5,000 empleados', '5000+': 'Más de 5,000 empleados', B2B: 'B2B – Empresa a Empresa', B2C: 'B2C – Empresa a Consumidor', Mixto: 'Mixto – B2B y B2C', Pública: 'Empresa Pública / Gubernamental', ONG: 'ONG / Sin fines de lucro' }
  return labels[option] || option
}
