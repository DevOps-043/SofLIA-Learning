'use client'

import type { CSSProperties, DragEvent, ReactNode } from 'react'
import {
  ImageIcon,
  ImageUp,
  Palette,
  Save,
  Sparkles,
  Upload,
  WandSparkles,
} from 'lucide-react'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useBrandingTabState } from './branding-tab'
import type { BrandingFormState } from './branding-tab/types'
import styles from './SettingsSections.module.css'

export function BrandingTab() {
  const {
    isLoading,
    error,
    isSaving,
    isDetecting,
    toast,
    hideToast,
    localBranding,
    setLocalBranding,
    handleSave,
    handleDetectColors,
    handleToggleBranding,
    openFileDialog,
    handleDropUpload,
  } = useBrandingTabState()

  if (isLoading) {
    return (
      <div className={styles.emptyState}>
        <div>
          <Palette aria-hidden="true" />
          <p>Preparando la identidad visual…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.emptyState}>
        <div>
          <Palette aria-hidden="true" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const setField = <K extends keyof BrandingFormState>(
    field: K,
    value: BrandingFormState[K],
  ) => {
    setLocalBranding((current) => ({ ...current, [field]: value }))
  }

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    folder: string,
    field: 'banner_url' | 'favicon_url',
  ) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) void handleDropUpload(file, folder, field)
  }

  const previewVariables = {
    '--preview-primary': localBranding.color_primary,
    '--preview-secondary': localBranding.color_secondary,
    '--preview-accent': localBranding.color_accent,
  } as CSSProperties

  return (
    <>
      <div className={styles.stack}>
        <section className={styles.section}>
          <SectionHeader
            icon={<Sparkles />}
            title="Identidad visual personalizada"
            description="Activa una experiencia de marca coherente en navegación, acceso y espacios de aprendizaje."
          />
          <div className={styles.sectionBody}>
            <div className={styles.switchRow}>
              <div className={styles.switchCopy}>
                <strong>Usar la marca de la organización</strong>
                <span>
                  Al desactivarla, SofLIA conserva su paleta predeterminada sin eliminar
                  esta configuración.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Usar la marca de la organización"
                aria-checked={localBranding.branding_enabled}
                className={styles.switch}
                data-checked={localBranding.branding_enabled}
                onClick={() => handleToggleBranding(!localBranding.branding_enabled)}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader
            icon={<ImageIcon />}
            title="Activos de marca"
            description="Imágenes limpias, legibles y preparadas para adaptarse a superficies claras u oscuras."
          />
          <div
            className={`${styles.sectionBody} ${
              !localBranding.branding_enabled ? styles.disabledGroup : ''
            }`}
          >
            <div className={styles.mediaGrid}>
              <BrandAsset
                title="Logotipo principal"
                description="PNG, JPG o SVG · fondo transparente recomendado"
                image={localBranding.banner_url}
                onUpload={() => openFileDialog('Logo-Empresa', 'banner_url')}
                onDrop={(event) => handleDrop(event, 'Logo-Empresa', 'banner_url')}
              />
              <BrandAsset
                compact
                title="Favicon y acceso"
                description="Formato cuadrado · 512 × 512 px"
                image={localBranding.favicon_url}
                onUpload={() => openFileDialog('Favicon', 'favicon_url')}
                onDrop={(event) => handleDrop(event, 'Favicon', 'favicon_url')}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader
            icon={<Palette />}
            title="Paleta de color"
            description="Tres decisiones cromáticas controlan jerarquía, superficies activas y acentos de interacción."
          />
          <div
            className={`${styles.sectionBody} ${
              !localBranding.branding_enabled ? styles.disabledGroup : ''
            }`}
          >
            <div className={styles.sectionTools}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={isDetecting || !localBranding.banner_url}
                onClick={() => void handleDetectColors()}
              >
                <WandSparkles aria-hidden="true" />
                {isDetecting ? 'Detectando…' : 'Extraer desde el logotipo'}
              </button>
            </div>

            <div className={styles.colorGrid}>
              <ColorControl
                label="Primario"
                value={localBranding.color_primary}
                onChange={(value) => setField('color_primary', value)}
              />
              <ColorControl
                label="Secundario"
                value={localBranding.color_secondary}
                onChange={(value) => setField('color_secondary', value)}
              />
              <ColorControl
                label="Acento"
                value={localBranding.color_accent}
                onChange={(value) => setField('color_accent', value)}
              />
            </div>

            <div className={styles.brandPreview} style={previewVariables}>
              <div className={styles.brandPreviewCopy}>
                <span>Vista previa</span>
                <strong>Una marca, una experiencia.</strong>
                <small>
                  Contraste, jerarquía y acentos se validan antes de guardar.
                </small>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.actionBar}>
          <div className={styles.actionMeta}>
            <Palette aria-hidden="true" />
            Sistema visual de la organización
          </div>
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              <Save aria-hidden="true" />
              {isSaving ? 'Guardando…' : 'Guardar identidad'}
            </button>
          </div>
        </div>
      </div>

      <ToastNotification
        isOpen={toast.isOpen}
        onClose={hideToast}
        message={toast.message}
        type={toast.type}
        position="top-right"
      />
    </>
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

function BrandAsset({
  title,
  description,
  image,
  compact = false,
  onUpload,
  onDrop,
}: {
  title: string
  description: string
  image: string
  compact?: boolean
  onUpload: () => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      className={`${styles.asset} ${compact ? styles.assetCompact : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className={styles.assetPreview}>
        {image ? (
          <img src={image} alt="" />
        ) : (
          <div className={styles.assetEmpty}>
            <ImageUp aria-hidden="true" />
            <span>Arrastra una imagen o selecciónala</span>
          </div>
        )}
      </div>
      <div className={styles.assetToolbar}>
        <span>
          {title} · {description}
        </span>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onUpload}
          aria-label={`Subir ${title}`}
        >
          <Upload aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className={styles.colorControl}>
      <span className={styles.colorSwatch}>
        <input
          type="color"
          value={value}
          aria-label={`Color ${label.toLowerCase()}`}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <span className={styles.colorMeta}>
        <strong>{label}</strong>
        <code>{value}</code>
      </span>
    </label>
  )
}
