'use client'

import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  FlagIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import type { EditUserFormData } from './types'

interface EditUserPersonalTabProps {
  formData: EditUserFormData
  onFieldChange: (
    name: keyof EditUserFormData,
    value: string | boolean,
    inputType?: string,
  ) => void
}

export function EditUserPersonalTab({
  formData,
  onFieldChange,
}: EditUserPersonalTabProps) {
  return (
    <motion.div
      key="personal"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="group">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            Nombre de usuario *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                onFieldChange('username', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            Email *
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                onFieldChange('email', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            Nombre
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) =>
              onFieldChange('first_name', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            Apellido
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) =>
              onFieldChange('last_name', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            Nombre para mostrar
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) =>
              onFieldChange('display_name', e.target.value, e.target.type)
            }
            className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            TelÃ©fono
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                onFieldChange('phone', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            UbicaciÃ³n
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                onFieldChange('location', e.target.value, e.target.type)
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
            CÃ³digo de paÃ­s
          </label>
          <div className="relative">
            <FlagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
            <input
              type="text"
              value={formData.country_code}
              onChange={(e) =>
                onFieldChange('country_code', e.target.value, e.target.type)
              }
              placeholder="MX, US, etc."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
          BiografÃ­a
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => onFieldChange('bio', e.target.value, e.target.type)}
          rows={3}
          className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Escribe una breve descripciÃ³n del usuario..."
        />
      </div>
    </motion.div>
  )
}
