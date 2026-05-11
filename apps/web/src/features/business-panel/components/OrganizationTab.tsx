'use client'

import { motion } from 'framer-motion'
import {
  AlertCircle,
  Brain,
  Building2,
  Check,
  CheckCircle,
  Copy,
  Globe,
  Image as ImageIcon,
  Info,
  Loader2,
  Mail,
  MapPin,
  Save,
  Sparkles,
  Type,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { type OrganizationData } from '../hooks/useBusinessSettings'
import type { BrandingData } from '../hooks/useBranding'
import { useOrgFormState } from './useOrgFormState'

export function OrganizationTab({
  organization,
  updateOrganization,
  branding,
  updateBranding,
  saveSuccess,
  setSaveSuccess,
  saveError,
  setSaveError,
}: {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  branding: BrandingData | null
  updateBranding: (data: Partial<BrandingData>) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
}) {
  const theme = useBusinessPanelTheme()
  const {
    formData,
    setFormData,
    isSaving,
    copiedFields,
    handleChange,
    handleSubmit,
    handleDiscard,
    copyToClipboard,
    uploadBanner,
    uploadLogo,
  } = useOrgFormState({
    organization,
    updateOrganization,
    branding,
    updateBranding,
    saveSuccess,
    setSaveSuccess,
    saveError,
    setSaveError,
  })

  if (!organization) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <Info
          className="w-20 h-20 mx-auto mb-6"
          style={{ color: theme.mutedTextColor }}
        />
        <p className="text-lg" style={{ color: theme.subtextColor }}>
          No hay información de organización disponible
        </p>
      </motion.div>
    )
  }

  const cardStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.borderColor,
  }

  const inputStyle = {
    backgroundColor: theme.inputBg,
    borderColor: theme.borderColor,
    color: theme.textColor,
  }

  const labelStyle = { color: theme.textColor }
  const helpStyle = { color: theme.subtextColor }
  const mutedStyle = { color: theme.mutedTextColor }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <div className="rounded-2xl p-6 border" style={cardStyle}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2.5 rounded-xl"
              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
            >
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={labelStyle}>
                Banner de la Empresa
              </h3>
              <p className="text-xs" style={helpStyle}>
                Imagen de fondo del panel
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={uploadBanner}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full relative h-32 rounded-xl overflow-hidden mb-4 border-2 border-dashed flex items-center justify-center"
            style={{
              borderColor: `${theme.actionColor}33`,
              backgroundColor: theme.inputBg,
            }}
          >
            {formData.banner_url ? (
              <img
                src={formData.banner_url}
                alt="Vista previa del banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2" style={mutedStyle} />
                <p className="text-xs font-medium" style={helpStyle}>
                  Haz clic para subir banner
                </p>
              </div>
            )}
          </motion.button>
        </div>

        <div className="rounded-2xl p-6 border" style={cardStyle}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2.5 rounded-xl"
              style={{
                backgroundColor: `${theme.secondaryColor}18`,
                color: theme.secondaryColor,
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={labelStyle}>
                Ícono de la Empresa
              </h3>
              <p className="text-xs" style={helpStyle}>
                Logo principal en formato cuadrado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <motion.button
              type="button"
              onClick={uploadLogo}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed flex items-center justify-center"
              style={{
                borderColor: `${theme.secondaryColor}33`,
                backgroundColor: theme.inputBg,
              }}
            >
              {formData.icon_url ? (
                <img
                  src={formData.icon_url}
                  alt="Vista previa del ícono"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Upload className="w-6 h-6" style={mutedStyle} />
              )}
            </motion.button>
            <div className="flex-1">
              <p className="text-sm font-medium mb-2" style={helpStyle}>
                Recomendado: 512x512 px. Formato PNG o SVG para mejores resultados.
              </p>
              <button
                type="button"
                onClick={uploadLogo}
                className="text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ color: theme.actionColor }}
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-6 border space-y-5"
          style={cardStyle}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={labelStyle}>
                Información Básica
              </h3>
              <p className="text-sm" style={helpStyle}>
                Datos principales de tu empresa
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={labelStyle}>
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
                style={inputStyle}
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-xl border"
              style={inputStyle}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
                >
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={labelStyle}>
                    Mostrar nombre en navbar
                  </p>
                  <p className="text-xs" style={helpStyle}>
                    Ocúltalo si el logo ya incluye el nombre
                  </p>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    show_navbar_name: !prev.show_navbar_name,
                  }))
                }
                whileTap={{ scale: 0.95 }}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                style={{
                  backgroundColor: formData.show_navbar_name
                    ? theme.actionColor
                    : theme.hoverBg,
                }}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
                  style={{ marginLeft: 4, translateX: formData.show_navbar_name ? 18 : 0 }}
                />
              </motion.button>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={labelStyle}>
                Descripción
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none focus:outline-none"
                  style={inputStyle}
                  placeholder="Describe tu empresa..."
                />
                <div
                  className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}
                >
                  {formData.description.length}/500
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium mb-2" style={labelStyle}>
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email de Contacto
                </span>
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
                style={inputStyle}
                placeholder="contacto@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="website_url" className="block text-sm font-medium mb-2" style={labelStyle}>
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sitio Web
                </span>
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
                style={inputStyle}
                placeholder="https://www.empresa.com"
              />
            </div>

            <div>
              <label htmlFor="max_users" className="block text-sm font-medium mb-2" style={labelStyle}>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Límite de usuarios
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  id="max_users"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  min="1"
                  className="flex-1 px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
                  style={inputStyle}
                  placeholder="10"
                />
                <span
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}
                >
                  usuarios
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-6 border space-y-5"
          style={cardStyle}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={labelStyle}>
                Información de Contacto
              </h3>
              <p className="text-sm" style={helpStyle}>
                Datos de contacto de tu organización
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Nombre de Contacto', value: formData.name, field: 'name' },
              { label: 'Descripción', value: formData.description || '', field: 'description' },
              { label: 'Email de Contacto', value: formData.contact_email || '', field: 'email' },
            ].map((item) => (
              <div key={item.field}>
                <label className="block text-sm font-medium mb-2" style={labelStyle}>
                  {item.label}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.value}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl border-2 cursor-default"
                    style={inputStyle}
                  />
                  <motion.button
                    type="button"
                    onClick={() => copyToClipboard(item.value, item.field)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg"
                    style={{
                      backgroundColor: copiedFields[item.field]
                        ? theme.successColor
                        : theme.actionColor,
                      color: copiedFields[item.field] ? '#FFFFFF' : theme.onActionColor,
                      boxShadow: `0 6px 18px ${
                        copiedFields[item.field] ? theme.successColor : theme.actionColor
                      }33`,
                    }}
                  >
                    {copiedFields[item.field] ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* SofLIA AI Context Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl p-6 border space-y-5"
        style={cardStyle}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}
          >
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={labelStyle}>
              Contexto para SofLIA
            </h3>
            <p className="text-sm" style={helpStyle}>
              Esta información permite a SofLIA adaptar sus respuestas al perfil real de tu empresa
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="industry" className="block text-sm font-medium mb-2" style={labelStyle}>
              Giro / Sector de la Empresa
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
              style={inputStyle}
            >
              <option value="">Selecciona un sector...</option>
              <option value="Tecnología e IT">Tecnología e IT</option>
              <option value="Manufactura e Industria">Manufactura e Industria</option>
              <option value="Salud y Farmacéutica">Salud y Farmacéutica</option>
              <option value="Servicios Financieros y Banca">Servicios Financieros y Banca</option>
              <option value="Retail y Comercio">Retail y Comercio</option>
              <option value="Educación">Educación</option>
              <option value="Logística y Transporte">Logística y Transporte</option>
              <option value="Construcción e Inmobiliaria">Construcción e Inmobiliaria</option>
              <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
              <option value="Marketing y Publicidad">Marketing y Publicidad</option>
              <option value="Consultoría y Servicios Profesionales">Consultoría y Servicios Profesionales</option>
              <option value="Energía y Recursos Naturales">Energía y Recursos Naturales</option>
              <option value="Telecomunicaciones">Telecomunicaciones</option>
              <option value="Turismo y Hospitalidad">Turismo y Hospitalidad</option>
              <option value="Gobierno y Sector Público">Gobierno y Sector Público</option>
              <option value="ONG y Sector Social">ONG y Sector Social</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="company_size" className="block text-sm font-medium mb-2" style={labelStyle}>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Tamaño de la Empresa
              </span>
            </label>
            <select
              id="company_size"
              name="company_size"
              value={formData.company_size}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
              style={inputStyle}
            >
              <option value="">Selecciona un rango...</option>
              <option value="1-10">1 – 10 empleados</option>
              <option value="11-50">11 – 50 empleados</option>
              <option value="51-200">51 – 200 empleados</option>
              <option value="201-1000">201 – 1,000 empleados</option>
              <option value="1001-5000">1,001 – 5,000 empleados</option>
              <option value="5000+">Más de 5,000 empleados</option>
            </select>
          </div>

          <div>
            <label htmlFor="company_type" className="block text-sm font-medium mb-2" style={labelStyle}>
              Tipo de Empresa
            </label>
            <select
              id="company_type"
              name="company_type"
              value={formData.company_type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
              style={inputStyle}
            >
              <option value="">Selecciona un tipo...</option>
              <option value="B2B">B2B – Empresa a Empresa</option>
              <option value="B2C">B2C – Empresa a Consumidor</option>
              <option value="Mixto">Mixto – B2B y B2C</option>
              <option value="Pública">Empresa Pública / Gubernamental</option>
              <option value="ONG">ONG / Sin fines de lucro</option>
            </select>
          </div>

          <div>
            <label htmlFor="company_country" className="block text-sm font-medium mb-2" style={labelStyle}>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                País de Operación
              </span>
            </label>
            <input
              type="text"
              id="company_country"
              name="company_country"
              value={formData.company_country}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none"
              style={inputStyle}
              placeholder="México, Colombia, España..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="company_mission" className="block text-sm font-medium mb-2" style={labelStyle}>
            Misión / Propósito de la Empresa
          </label>
          <div className="relative">
            <textarea
              id="company_mission"
              name="company_mission"
              value={formData.company_mission}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none focus:outline-none"
              style={inputStyle}
              placeholder="Describe la misión o propósito central de tu empresa..."
            />
            <div
              className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}
            >
              {formData.company_mission.length}/500
            </div>
          </div>
          <p className="text-xs mt-1.5" style={helpStyle}>
            SofLIA usará esta información para contextualizar ejemplos, actividades y recomendaciones a la realidad de tu empresa.
          </p>
        </div>
      </motion.div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-2xl p-5 flex items-center gap-4 border"
          style={{
            backgroundColor: `${theme.successColor}14`,
            borderColor: `${theme.successColor}33`,
          }}
        >
          <CheckCircle className="w-6 h-6" style={{ color: theme.successColor }} />
          <p className="font-medium" style={{ color: theme.successColor }}>
            {saveSuccess}
          </p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-2xl p-5 flex items-center gap-4 border"
          style={{
            backgroundColor: `${theme.dangerColor}14`,
            borderColor: `${theme.dangerColor}33`,
          }}
        >
          <AlertCircle className="w-6 h-6" style={{ color: theme.dangerColor }} />
          <p className="font-medium" style={{ color: theme.dangerColor }}>
            {saveError}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between gap-4 pt-4"
      >
        <motion.button
          type="button"
          onClick={handleDiscard}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3.5 rounded-xl font-semibold transition-all border flex items-center gap-2"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          <X className="w-5 h-5" />
          Descartar Cambios
        </motion.button>

        <motion.button
          type="submit"
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02, x: isSaving ? 0 : 2 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className="px-8 py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl"
          style={{
            backgroundColor: theme.actionColor,
            color: theme.onActionColor,
            boxShadow: `0 8px 30px ${theme.actionColor}33`,
          }}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-5 h-5" />
              </motion.div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Cambios
            </>
          )}
        </motion.button>
      </motion.div>
    </form>
  )
}
