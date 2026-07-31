'use client'

import type { ReactNode } from 'react'
import {
  BrainCircuit,
  Building2,
  Globe2,
  ImageUp,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Upload,
  Users,
} from 'lucide-react'
import { useOrgFormState } from './useOrgFormState'
import { PremiumSelect } from './PremiumSelect'
import {
  COMPANY_SIZE_OPTIONS,
  COMPANY_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
} from './OrganizationTab/lia-context-options'
import type { OrganizationTabProps } from './OrganizationTab/types'
import styles from './SettingsSections.module.css'

export function OrganizationTab(props: OrganizationTabProps) {
  const formState = useOrgFormState(props)

  if (!props.organization) {
    return (
      <div className={styles.emptyState}>
        <div>
          <Building2 aria-hidden="true" />
          <p>No hay información de la organización disponible.</p>
        </div>
      </div>
    )
  }

  const { formData, setFormData } = formState
  const setField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  return (
    <form onSubmit={formState.handleSubmit} className={styles.stack}>
      <section className={styles.section}>
        <SectionHeader
          icon={<ImageUp />}
          title="Presencia de la organización"
          description="El banner acompaña los espacios administrativos; el isotipo identifica a la organización en navegación y acceso."
        />
        <div className={styles.sectionBody}>
          <div className={styles.mediaGrid}>
            <AssetPanel
              label="Banner institucional"
              image={formData.banner_url}
              onUpload={formState.uploadBanner}
              emptyText="Añade una imagen horizontal de alta resolución"
            />
            <AssetPanel
              compact
              label="Isotipo"
              image={formData.logo_url}
              onUpload={formState.uploadLogo}
              emptyText="PNG o SVG, formato cuadrado"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          icon={<Building2 />}
          title="Identidad operativa"
          description="Información visible para los miembros y datos de contacto de la organización."
        />
        <div className={styles.sectionBody}>
          <div className={styles.fieldGrid}>
            <Field label="Nombre de la empresa" required>
              <input
                className={styles.input}
                name="name"
                value={formData.name}
                onChange={formState.handleChange}
                required
              />
            </Field>

            <Field label="Límite de usuarios" icon={<Users />}>
              <input
                className={styles.input}
                name="max_users"
                type="number"
                min="1"
                value={formData.max_users}
                onChange={formState.handleChange}
              />
            </Field>

            <div className={styles.fieldWide}>
              <div className={styles.switchRow}>
                <div className={styles.switchCopy}>
                  <strong>Mostrar el nombre en la navegación</strong>
                  <span>Ocúltalo cuando el logotipo ya comunique el nombre con claridad.</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.show_navbar_name}
                  className={styles.switch}
                  data-checked={formData.show_navbar_name}
                  onClick={() => setField('show_navbar_name', !formData.show_navbar_name)}
                />
              </div>
            </div>

            <Field label="Descripción" wide>
              <textarea
                className={styles.textarea}
                name="description"
                value={formData.description}
                onChange={formState.handleChange}
                maxLength={500}
                placeholder="Describe brevemente a tu organización."
              />
              <p className={styles.help}>{formData.description.length}/500 caracteres</p>
            </Field>

            <Field label="Correo de contacto" icon={<Mail />}>
              <input
                className={styles.input}
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={formState.handleChange}
                placeholder="contacto@empresa.com"
              />
            </Field>

            <Field label="Teléfono" icon={<Phone />}>
              <input
                className={styles.input}
                name="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={formState.handleChange}
                placeholder="+52 55 0000 0000"
              />
            </Field>

            <Field label="Sitio web" icon={<Globe2 />} wide>
              <input
                className={styles.input}
                name="website_url"
                type="url"
                value={formData.website_url}
                onChange={formState.handleChange}
                placeholder="https://empresa.com"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeader
          icon={<BrainCircuit />}
          title="Contexto para SofLIA"
          description="Estos datos permiten adaptar ejemplos, recomendaciones y lenguaje a la realidad de la empresa."
        />
        <div className={styles.sectionBody}>
          <div className={styles.fieldGrid}>
            <Field label="Sector">
              <PremiumSelect
                className={styles.premiumSelect}
                value={formData.industry}
                options={INDUSTRY_OPTIONS}
                placeholder="Selecciona un sector"
                onValueChange={(value) => setField('industry', value)}
              />
            </Field>

            <Field label="Tamaño de la empresa" icon={<Users />}>
              <PremiumSelect
                className={styles.premiumSelect}
                value={formData.company_size}
                options={COMPANY_SIZE_OPTIONS}
                placeholder="Selecciona un rango"
                onValueChange={(value) => setField('company_size', value)}
              />
            </Field>

            <Field label="Tipo de empresa">
              <PremiumSelect
                className={styles.premiumSelect}
                value={formData.company_type}
                options={COMPANY_TYPE_OPTIONS}
                placeholder="Selecciona un tipo"
                onValueChange={(value) => setField('company_type', value)}
              />
            </Field>

            <Field label="País de operación" icon={<MapPin />}>
              <input
                className={styles.input}
                name="company_country"
                value={formData.company_country}
                onChange={formState.handleChange}
                placeholder="México, Colombia, España..."
              />
            </Field>

            <Field label="Misión o propósito" wide>
              <textarea
                className={styles.textarea}
                name="company_mission"
                value={formData.company_mission}
                onChange={formState.handleChange}
                maxLength={500}
                placeholder="Describe el propósito central de tu organización."
              />
              <p className={styles.help}>{formData.company_mission.length}/500 caracteres</p>
            </Field>
          </div>
        </div>
      </section>

      <div className={styles.actionBar}>
        <div className={styles.actionMeta}>
          <Building2 aria-hidden="true" />
          Identidad y contexto organizacional
        </div>
        <div className={styles.actionButtons}>
          <button type="button" className={styles.secondaryButton} onClick={formState.handleDiscard}>
            <RotateCcw aria-hidden="true" />
            Descartar
          </button>
          <button type="submit" className={styles.primaryButton} disabled={formState.isSaving}>
            <Save aria-hidden="true" />
            {formState.isSaving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <header className={styles.sectionHeader}>
      <span className={styles.sectionIcon}>{icon}</span>
      <div className={styles.sectionCopy}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
    </header>
  )
}

function Field({
  label,
  icon,
  wide,
  required,
  children,
}: {
  label: string
  icon?: ReactNode
  wide?: boolean
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className={`${styles.field} ${wide ? styles.fieldWide : ''}`}>
      <span className={styles.label}>
        {icon}
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

function AssetPanel({
  label,
  image,
  onUpload,
  emptyText,
  compact = false,
}: {
  label: string
  image: string
  onUpload: () => void
  emptyText: string
  compact?: boolean
}) {
  return (
    <div className={`${styles.asset} ${compact ? styles.assetCompact : ''}`}>
      <div className={styles.assetPreview}>
        {image ? (
          <img src={image} alt="" />
        ) : (
          <div className={styles.assetEmpty}>
            <ImageUp aria-hidden="true" />
            <span>{emptyText}</span>
          </div>
        )}
      </div>
      <div className={styles.assetToolbar}>
        <span>{label}</span>
        <button type="button" className={styles.iconButton} onClick={onUpload} aria-label={`Cambiar ${label}`}>
          <Upload aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
