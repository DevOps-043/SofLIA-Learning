'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  Users,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Shield,
  Image,
  Link2,
  FileText,
  Save,
  Edit3,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react'
import { SOFLIA_ADMIN_COLORS } from '../constants/admin-color-tokens'
import { AdminCommunity } from '../services/adminCommunities.service'

const colors = SOFLIA_ADMIN_COLORS

interface EditCommunityModalProps {
  community: AdminCommunity | null
  isOpen: boolean
  onClose: () => void
  onSave: (communityData: any) => Promise<void>
}

// ============================================
// PREMIUM INPUT COMPONENT
// ============================================
interface PremiumInputProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  icon?: React.ReactNode
  required?: boolean
  error?: string
  disabled?: boolean
  type?: string
}

function PremiumInput({ label, name, value, onChange, placeholder, icon, required, error, disabled, type = 'text' }: PremiumInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span style={{ color: colors.accent }}>*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
            style={{ color: isFocused ? colors.accent : colors.grayMedium }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-xl bg-[#0A0D12] text-white placeholder-gray-500 border transition-all duration-300 outline-none ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-white/10 focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20 hover:border-white/20'
          }`}
        />
        {isFocused && !error && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ 
              boxShadow: `0 0 20px ${colors.accent}20`,
              border: `1px solid ${colors.accent}50`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm flex items-center gap-1.5"
          style={{ color: colors.error }}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </motion.p>
      )}
    </div>
  )
}

// ============================================
// PREMIUM SELECT COMPONENT
// ============================================
interface PremiumSelectProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  icon?: React.ReactNode
  required?: boolean
  disabled?: boolean
}

function PremiumSelect({ label, name, value, onChange, options, icon, required, disabled }: PremiumSelectProps) {
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span style={{ color: colors.accent }}>*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10"
            style={{ color: isFocused ? colors.accent : colors.grayMedium }}
          >
            {icon}
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-10 py-3.5 rounded-xl bg-[#0A0D12] text-white border border-white/10 transition-all duration-300 outline-none cursor-pointer appearance-none hover:border-white/20 focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
      </div>
    </div>
  )
}

// ============================================
// PREMIUM TEXTAREA COMPONENT
// ============================================
interface PremiumTextareaProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  required?: boolean
  error?: string
  rows?: number
}

function PremiumTextarea({ label, name, value, onChange, placeholder, required, error, rows = 4 }: PremiumTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span style={{ color: colors.accent }}>*</span>}
      </label>
      <div className="relative">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-4 py-3.5 rounded-xl bg-[#0A0D12] text-white placeholder-gray-500 border transition-all duration-300 outline-none resize-none ${
            error 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-white/10 focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20 hover:border-white/20'
          }`}
        />
        {isFocused && !error && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ 
              boxShadow: `0 0 20px ${colors.accent}20`,
              border: `1px solid ${colors.accent}50`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm flex items-center gap-1.5"
          style={{ color: colors.error }}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </motion.p>
      )}
    </div>
  )
}

// ============================================
// SECTION HEADER COMPONENT
// ============================================
interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
}

function SectionHeader({ icon, title, subtitle, color }: SectionHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 rounded-xl mb-6"
      style={{ 
        background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)`,
        border: `1px solid ${color}30`
      }}
    >
      <div 
        className="p-3 rounded-xl"
        style={{ background: `${color}20` }}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </motion.div>
  )
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================
export function EditCommunityModal({ community, isOpen, onClose, onSave }: EditCommunityModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    is_active: true,
    visibility: 'public',
    access_type: 'open'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || '',
        description: community.description || '',
        slug: community.slug || '',
        image_url: community.image_url || '',
        is_active: community.is_active,
        visibility: community.visibility || 'public',
        access_type: community.access_type || 'open'
      })
    }
  }, [community])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar comunidad')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !community) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl"
            style={{ 
              background: `linear-gradient(145deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)`,
              border: `1px solid rgba(255,255,255,0.1)`
            }}
          >
            {/* Decorative glow */}
            <div 
              className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: colors.purple }}
            />

            {/* Header */}
            <div 
              className="relative p-6 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="p-3 rounded-2xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.purple} 0%, ${colors.primary} 100%)`,
                      boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Edit3 className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Editar Comunidad</h2>
                    <p className="text-gray-400 text-sm mt-0.5">
                      Modificando: <span className="text-white font-medium">{community.name}</span>
                    </p>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Global Error */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ 
                    background: `${colors.error}15`,
                    border: `1px solid ${colors.error}30`
                  }}
                >
                  <AlertCircle className="w-5 h-5" style={{ color: colors.error }} />
                  <p className="text-sm" style={{ color: colors.error }}>{error}</p>
                </motion.div>
              )}

              {/* Section 1: Basic Info */}
              <div>
                <SectionHeader 
                  icon={<Users className="w-5 h-5" style={{ color: colors.accent }} />}
                  title="Información Básica"
                  subtitle="Datos principales de la comunidad"
                  color={colors.accent}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <PremiumInput
                    label="Nombre de la comunidad"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="ej. Comunidad de Desarrolladores"
                    icon={<Users className="w-5 h-5" />}
                    required
                  />
                  
                  <PremiumInput
                    label="Slug (URL amigable)"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="ej. comunidad-desarrolladores"
                    icon={<Link2 className="w-5 h-5" />}
                    required
                  />
                </div>

                <div className="mt-5">
                  <PremiumTextarea
                    label="Descripción"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe el propósito y objetivos de la comunidad..."
                    required
                    rows={3}
                  />
                </div>

                {/* Image URL */}
                <div className="mt-5">
                  <PremiumInput
                    label="URL de imagen"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    icon={<Image className="w-5 h-5" />}
                    type="url"
                  />
                  {formData.image_url && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 rounded-xl bg-[#0A0D12] border border-white/10"
                    >
                      <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="h-24 w-auto rounded-lg object-cover"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Section 2: Privacy Settings */}
              <div>
                <SectionHeader 
                  icon={<Shield className="w-5 h-5" style={{ color: colors.purple }} />}
                  title="Configuración de Privacidad"
                  subtitle="Controla quién puede ver y acceder a la comunidad"
                  color={colors.purple}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <PremiumSelect
                    label="Visibilidad"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    icon={<Globe className="w-5 h-5" />}
                    options={[
                      { value: 'public', label: 'ðŸŒ Pública - Visible para todos' },
                      { value: 'private', label: '🔒 Privada - Solo miembros' }
                    ]}
                    required
                  />
                  
                  <PremiumSelect
                    label="Tipo de Acceso"
                    name="access_type"
                    value={formData.access_type}
                    onChange={handleChange}
                    icon={<Lock className="w-5 h-5" />}
                    options={[
                      { value: 'open', label: '✅ Abierto - Cualquiera puede unirse' },
                      { value: 'moderated', label: 'ðŸ‘€ Moderado - Requiere aprobación' },
                      { value: 'invite_only', label: 'âœ‰ï¸ Solo invitación' }
                    ]}
                    required
                  />
                </div>
              </div>

              {/* Section 3: Status */}
              <div>
                <SectionHeader 
                  icon={formData.is_active ? <Eye className="w-5 h-5" style={{ color: colors.success }} /> : <EyeOff className="w-5 h-5" style={{ color: colors.grayMedium }} />}
                  title="Estado de la Comunidad"
                  subtitle="Controla si la comunidad está activa y visible"
                  color={formData.is_active ? colors.success : colors.grayMedium}
                />
                
                <motion.label 
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
                  style={{ 
                    background: formData.is_active ? `${colors.success}10` : colors.bgTertiary,
                    border: `1px solid ${formData.is_active ? colors.success + '30' : 'rgba(255,255,255,0.05)'}`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: formData.is_active ? `${colors.success}20` : 'rgba(255,255,255,0.05)' }}
                    >
                      {formData.is_active ? (
                        <Eye className="w-5 h-5" style={{ color: colors.success }} />
                      ) : (
                        <EyeOff className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Comunidad {formData.is_active ? 'Activa' : 'Inactiva'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formData.is_active ? 'Visible para los usuarios' : 'Oculta para los usuarios'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Custom Toggle */}
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div 
                      className="w-14 h-8 rounded-full p-1 transition-colors duration-300"
                      style={{ background: formData.is_active ? colors.success : 'rgba(255,255,255,0.1)' }}
                    >
                      <motion.div 
                        className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                        animate={{ x: formData.is_active ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {formData.is_active && (
                          <Check className="w-3.5 h-3.5" style={{ color: colors.success }} />
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.label>
              </div>

              {/* Data Protection Notice */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.accent}10 100%)`,
                  border: `1px solid ${colors.accent}20`
                }}
              >
                <div className="p-2 rounded-lg" style={{ background: `${colors.accent}20` }}>
                  <Shield className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <h5 className="text-sm font-semibold" style={{ color: colors.accent }}>
                    Protección de Datos
                  </h5>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    La modificación será registrada en el log de auditoría conforme a la LFPDPPP y las normas ISO 27001.
                  </p>
                </div>
              </motion.div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancelar
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-50"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.purple} 0%, ${colors.primary} 100%)`,
                    boxShadow: '0 5px 20px rgba(139, 92, 246, 0.2)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
