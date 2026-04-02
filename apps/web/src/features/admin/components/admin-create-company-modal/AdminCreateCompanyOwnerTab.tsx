'use client'

import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import type { CreateCompanyData } from './types'

interface AdminCreateCompanyOwnerTabProps {
  accentColor: string
  formData: CreateCompanyData
  onFormDataChange: (updater: (current: CreateCompanyData) => CreateCompanyData) => void
}

export function AdminCreateCompanyOwnerTab({
  accentColor,
  formData,
  onFormDataChange,
}: AdminCreateCompanyOwnerTabProps) {
  return (
    <motion.div
      key="owner"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-3xl"
    >
      <div className="text-sm text-gray-400 border-b border-white/5 pb-4 mb-6">
        Ingresa los datos del propietario de la organizaciÃ³n. Se le enviarÃ¡ una
        invitaciÃ³n por correo electrÃ³nico para que configure su cuenta.
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-accent/20">
            <UserCircleIcon className="w-8 h-8" style={{ color: accentColor }} />
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">
              Propietario de la OrganizaciÃ³n
            </h4>
            <p className="text-sm text-gray-400">
              TendrÃ¡ control total sobre la organizaciÃ³n
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
              Correo electrÃ³nico del propietario{' '}
              <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={formData.owner_email || ''}
                onChange={(e) =>
                  onFormDataChange((current) => ({
                    ...current,
                    owner_email: e.target.value,
                  }))
                }
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition-all"
                placeholder="propietario@empresa.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
              Cargo / PosiciÃ³n{' '}
              <span className="text-xs text-gray-600">(Opcional)</span>
            </label>
            <input
              type="text"
              value={formData.owner_position || ''}
              onChange={(e) =>
                onFormDataChange((current) => ({
                  ...current,
                  owner_position: e.target.value,
                }))
              }
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/20 outline-none transition-all"
              placeholder="Ej: CEO, Director General, Gerente"
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-2">
              <strong className="text-white">Â¿QuÃ© sucederÃ¡ despuÃ©s?</strong>
            </p>
            <ul className="space-y-1 text-xs">
              <li>Ã¢â‚¬Â¢ Se crearÃ¡ la organizaciÃ³n con la configuraciÃ³n especificada</li>
              <li>Ã¢â‚¬Â¢ El propietario recibirÃ¡ un email con un enlace para registrarse</li>
              <li>Ã¢â‚¬Â¢ La invitaciÃ³n expira en 7 dÃ­as</li>
              <li>Ã¢â‚¬Â¢ PodrÃ¡s ver el estado de la invitaciÃ³n en el panel de administraciÃ³n</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
