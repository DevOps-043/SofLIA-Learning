'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Eye, EyeOff, Globe, Lock, Shield, Image, Link2, ChevronRight,
  Check, AlertCircle
} from 'lucide-react'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import type { CommunityFormData } from './useEditCommunityFormState'

const colors = SOFLIA_ADMIN_COLORS

// --- Primitive UI Components ----------------------------------

interface PremiumInputProps {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; icon?: React.ReactNode; required?: boolean
  error?: string; disabled?: boolean; type?: string
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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: isFocused ? colors.accent : colors.grayMedium }}>
            {icon}
          </div>
        )}
        <input
          type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          required={required} disabled={disabled}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-xl bg-[#0A0D12] text-white placeholder-gray-500 border transition-all duration-300 outline-none ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-white/10 focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20 hover:border-white/20'
          }`}
        />
        {isFocused && !error && (
          <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: `0 0 20px ${colors.accent}20`, border: `1px solid ${colors.accent}50` }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm flex items-center gap-1.5" style={{ color: colors.error }}>
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </motion.p>
      )}
    </div>
  )
}

interface PremiumSelectProps {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  icon?: React.ReactNode; required?: boolean; disabled?: boolean
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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10" style={{ color: isFocused ? colors.accent : colors.grayMedium }}>
            {icon}
          </div>
        )}
        <select name={name} value={value} onChange={onChange} required={required} disabled={disabled}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-10 py-3.5 rounded-xl bg-[#0A0D12] text-white border border-white/10 transition-all duration-300 outline-none cursor-pointer appearance-none hover:border-white/20 focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20`}
        >
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
      </div>
    </div>
  )
}

interface PremiumTextareaProps {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string; required?: boolean; error?: string; rows?: number
}

function PremiumTextarea({ label, name, value, onChange, placeholder, required, error, rows = 4 }: PremiumTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label} {required && <span style={{ color: colors.accent }}>*</span>}
      </label>
      <div className="relative">
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          className={`w-full px-4 py-3.5 rounded-xl bg-[#0A0D12] text-white placeholder-gray-500 border transition-all duration-300 outline-none resize-none ${
            error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20 hover:border-white/20'
          }`}
        />
        {isFocused && !error && (
          <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: `0 0 20px ${colors.accent}20`, border: `1px solid ${colors.accent}50` }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="text-sm flex items-center gap-1.5" style={{ color: colors.error }}>
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </motion.p>
      )}
    </div>
  )
}

interface SectionHeaderProps { icon: React.ReactNode; title: string; subtitle: string; color: string }

function SectionHeader({ icon, title, subtitle, color }: SectionHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 rounded-xl mb-6"
      style={{ background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)`, border: `1px solid ${color}30` }}
    >
      <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>{icon}</div>
      <div>
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </motion.div>
  )
}

// --- Exported Sections ----------------------------------------

type FormChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>

interface CommunityFormSectionsProps {
  formData: CommunityFormData
  handleChange: (e: FormChangeEvent) => void
}

export function CommunityFormSections({ formData, handleChange }: CommunityFormSectionsProps) {
  return (
    <>
      {/* Section 1: Basic Info */}
      <div>
        <SectionHeader
          icon={<Users className="w-5 h-5" style={{ color: colors.accent }} />}
          title="Información Básica" subtitle="Datos principales de la comunidad" color={colors.accent}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PremiumInput label="Nombre de la comunidad" name="name" value={formData.name}
            onChange={handleChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            placeholder="ej. Comunidad de Desarrolladores" icon={<Users className="w-5 h-5" />} required />
          <PremiumInput label="Slug (URL amigable)" name="slug" value={formData.slug}
            onChange={handleChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            placeholder="ej. comunidad-desarrolladores" icon={<Link2 className="w-5 h-5" />} required />
        </div>
        <div className="mt-5">
          <PremiumTextarea label="Descripción" name="description" value={formData.description}
            onChange={handleChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
            placeholder="Describe el propósito y objetivos de la comunidad..." required rows={3} />
        </div>
        <div className="mt-5">
          <PremiumInput label="URL de imagen" name="image_url" value={formData.image_url}
            onChange={handleChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            placeholder="https://ejemplo.com/imagen.jpg" icon={<Image className="w-5 h-5" />} type="url" />
          {formData.image_url && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-3 rounded-xl bg-[#0A0D12] border border-white/10">
              <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
              <img src={formData.image_url} alt="Preview" className="h-24 w-auto rounded-lg object-cover"
                onError={(e) => e.currentTarget.style.display = 'none'} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Section 2: Privacy Settings */}
      <div>
        <SectionHeader
          icon={<Shield className="w-5 h-5" style={{ color: colors.purple }} />}
          title="Configuración de Privacidad" subtitle="Controla quién puede ver y acceder a la comunidad" color={colors.purple}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PremiumSelect label="Visibilidad" name="visibility" value={formData.visibility}
            onChange={handleChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
            icon={<Globe className="w-5 h-5" />}
            options={[
              { value: 'public', label: '🌍 Pública - Visible para todos' },
              { value: 'private', label: '🔒 Privada - Solo miembros' }
            ]} required />
          <PremiumSelect label="Tipo de Acceso" name="access_type" value={formData.access_type}
            onChange={handleChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
            icon={<Lock className="w-5 h-5" />}
            options={[
              { value: 'open', label: '✅ Abierto - Cualquiera puede unirse' },
              { value: 'moderated', label: '👀 Moderado - Requiere aprobación' },
              { value: 'invite_only', label: '✉️ Solo invitación' }
            ]} required />
        </div>
      </div>

      {/* Section 3: Status */}
      <div>
        <SectionHeader
          icon={formData.is_active ? <Eye className="w-5 h-5" style={{ color: colors.success }} /> : <EyeOff className="w-5 h-5" style={{ color: colors.grayMedium }} />}
          title="Estado de la Comunidad" subtitle="Controla si la comunidad está activa y visible"
          color={formData.is_active ? colors.success : colors.grayMedium}
        />
        <motion.label whileHover={{ scale: 1.01 }} className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all"
          style={{ background: formData.is_active ? `${colors.success}10` : colors.bgTertiary, border: `1px solid ${formData.is_active ? colors.success + '30' : 'rgba(255,255,255,0.05)'}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: formData.is_active ? `${colors.success}20` : 'rgba(255,255,255,0.05)' }}>
              {formData.is_active ? <Eye className="w-5 h-5" style={{ color: colors.success }} /> : <EyeOff className="w-5 h-5 text-gray-500" />}
            </div>
            <div>
              <p className="font-medium text-white">Comunidad {formData.is_active ? 'Activa' : 'Inactiva'}</p>
              <p className="text-sm text-gray-400">{formData.is_active ? 'Visible para los usuarios' : 'Oculta para los usuarios'}</p>
            </div>
          </div>
          <div className="relative">
            <input type="checkbox" name="is_active" checked={formData.is_active}
              onChange={handleChange as (e: React.ChangeEvent<HTMLInputElement>) => void} className="sr-only" />
            <div className="w-14 h-8 rounded-full p-1 transition-colors duration-300" style={{ background: formData.is_active ? colors.success : 'rgba(255,255,255,0.1)' }}>
              <motion.div className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                animate={{ x: formData.is_active ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                {formData.is_active && <Check className="w-3.5 h-3.5" style={{ color: colors.success }} />}
              </motion.div>
            </div>
          </div>
        </motion.label>
      </div>

      {/* Data Protection Notice */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: `linear-gradient(135deg, ${colors.primary}30 0%, ${colors.accent}10 100%)`, border: `1px solid ${colors.accent}20` }}>
        <div className="p-2 rounded-lg" style={{ background: `${colors.accent}20` }}>
          <Shield className="w-5 h-5" style={{ color: colors.accent }} />
        </div>
        <div>
          <h5 className="text-sm font-semibold" style={{ color: colors.accent }}>Protección de Datos</h5>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            La modificación será registrada en el log de auditoría conforme a la LFPDPPP y las normas ISO 27001.
          </p>
        </div>
      </motion.div>
    </>
  )
}
