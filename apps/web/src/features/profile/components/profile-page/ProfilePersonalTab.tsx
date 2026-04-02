'use client'

import { motion } from 'framer-motion'
import { AtSign, Briefcase, MapPin, Phone, User } from 'lucide-react'
import { PremiumInput, PremiumTextarea } from './ProfilePremiumFields'
import type { ProfileColorPalette, UpdateProfileRequest } from '../../types/profile.types'

interface ProfilePersonalTabProps {
  formData: UpdateProfileRequest
  handleInputChange: (field: keyof UpdateProfileRequest, value: string) => void
  colors: ProfileColorPalette
}

export function ProfilePersonalTab({ formData, handleInputChange, colors }: ProfilePersonalTabProps) {
  return (
    <motion.div key="personal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <PremiumInput label="Nombre" value={formData.first_name || ''} onChange={value => handleInputChange('first_name', value)} icon={<User className="w-4 h-4" />} colors={colors} />
        <PremiumInput label="Apellido" value={formData.last_name || ''} onChange={value => handleInputChange('last_name', value)} icon={<User className="w-4 h-4" />} colors={colors} />
        <PremiumInput label="Nombre de Usuario" value={formData.username || ''} onChange={value => handleInputChange('username', value)} icon={<AtSign className="w-4 h-4" />} colors={colors} />
        <PremiumInput label="Rol en la Empresa" value={formData.type_rol || ''} onChange={value => handleInputChange('type_rol', value)} icon={<Briefcase className="w-4 h-4" />} colors={colors} />
        <PremiumInput label="Teléfono" value={formData.phone || ''} onChange={value => handleInputChange('phone', value)} icon={<Phone className="w-4 h-4" />} type="tel" colors={colors} />
        <PremiumInput label="Ubicación" value={formData.location || ''} onChange={value => handleInputChange('location', value)} icon={<MapPin className="w-4 h-4" />} colors={colors} />
      </div>

      <PremiumTextarea label="Biografía" value={formData.bio || ''} onChange={value => handleInputChange('bio', value)} maxLength={500} rows={4} colors={colors} />
    </motion.div>
  )
}
