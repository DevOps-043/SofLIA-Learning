'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  DocumentTextIcon, // LinkIcon removed as it's no longer used for the 'additional' tab
  AcademicCapIcon,
  GlobeAltIcon,
  StarIcon,
  FlagIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: any) => Promise<void>
}

type TabType = 'basic' | 'personal' | 'additional'

// Componente de Select personalizado para Rol
function RoleSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const roles = [
    { value: 'Usuario', label: 'Usuario', icon: UserIcon, color: '#10B981' },
    { value: 'Instructor', label: 'Instructor', icon: AcademicCapIcon, color: '#F59E0B' },
    { value: 'Administrador', label: 'Administrador', icon: ShieldCheckIcon, color: '#0A2540' }
  ]

  const selectedRole = roles.find(r => r.value === value) || roles[0]
  const SelectedIcon = selectedRole.icon

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calcular posición del dropdown
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="group" ref={selectRef}>
      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
        Rol *
      </label>
      <div className="relative">
        <motion.button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white transition-all duration-200 flex items-center justify-between ${
            isOpen
              ? 'border-[#00D4B3] ring-2 ring-[#00D4B3]/40'
              : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className={`h-4 w-4 transition-colors ${
              isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
            }`} />
            <span className="font-medium">{selectedRole.label}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className={`h-4 w-4 transition-colors ${
              isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
            }`} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[55]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-[60] bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`
                }}
              >
                <div className="p-1.5">
                  {roles.map((role, index) => {
                    const RoleIcon = role.icon
                    const isSelected = role.value === value
                    
                    return (
                      <motion.button
                        key={role.value}
                        type="button"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4, backgroundColor: isSelected ? undefined : 'rgba(0, 212, 179, 0.1)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onChange(role.value)
                          setIsOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3]'
                            : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#00D4B3]/20'
                              : 'bg-[#E9ECEF] dark:bg-[#0A0D12]'
                          }`}>
                            <RoleIcon className={`h-4 w-4 ${
                              isSelected ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
                            }`} />
                          </div>
                          <span className="font-medium">{role.label}</span>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <CheckCircleIcon className="h-5 w-5 text-[#00D4B3]" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    cargo_rol: 'Usuario',
    type_rol: '',
    phone: '',
    bio: '',
    location: '',
    profile_picture_url: '',
    curriculum_url: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    points: 0,
    country_code: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData)
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        cargo_rol: 'Usuario',
        type_rol: '',
        phone: '',
        bio: '',
        location: '',
        profile_picture_url: '',
        curriculum_url: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        points: 0,
        country_code: ''
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const tabs: { id: TabType; label: string; icon: typeof UserIcon }[] = [
    { id: 'basic', label: 'Básica', icon: UserIcon },
    { id: 'personal', label: 'Personal', icon: UserIcon },
    { id: 'additional', label: 'Adicional', icon: GlobeAltIcon } // Changed icon from LinkIcon to GlobeAltIcon
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[150] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Compacto */}
                <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                        <PlusIcon className="h-5 w-5 text-[#00D4B3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Agregar Nuevo Usuario
                        </h3>
                        <p className="text-xs text-white/70">
                          Crear un nuevo usuario en la plataforma
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                            : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {/* Tab: Básica */}
                      {activeTab === 'basic' && (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Username */}
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Nombre de usuario *
                              </label>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="text"
                                  name="username"
                                  value={formData.username}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                  required
                                />
                              </div>
                            </div>

                            {/* Email */}
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Email *
                              </label>
                              <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                  required
                                />
                              </div>
                            </div>

                            {/* Password */}
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Contraseña *
                              </label>
                              <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="password"
                                  name="password"
                                  value={formData.password}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                  required
                                  minLength={6}
                                />
                              </div>
                            </div>

                            {/* Role - Custom Dropdown */}
                            <RoleSelect
                              value={formData.cargo_rol}
                              onChange={(value) => setFormData(prev => ({ ...prev, cargo_rol: value }))}
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: Personal */}
                      {activeTab === 'personal' && (
                        <motion.div
                          key="personal"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Nombre
                              </label>
                              <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              />
                            </div>

                            {/* Last Name */}
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Apellido
                              </label>
                              <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              />
                            </div>

                            {/* Display Name */}
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Nombre para mostrar
                              </label>
                              <input
                                type="text"
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              />
                            </div>

                            {/* Phone */}
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Teléfono
                              </label>
                              <div className="relative">
                                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="tel"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                            </div>

                            {/* Location */}
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Ubicación
                              </label>
                              <div className="relative">
                                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="text"
                                  name="location"
                                  value={formData.location}
                                  onChange={handleChange}
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                            </div>

                            {/* Country Code */}
                            <div className="group">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Código de país
                              </label>
                              <div className="relative">
                                <FlagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                                <input
                                  type="text"
                                  name="country_code"
                                  value={formData.country_code}
                                  onChange={handleChange}
                                  placeholder="MX, US, etc."
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Biografía
                            </label>
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleChange}
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Escribe una breve descripción del usuario..."
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: Adicional */}
                      {activeTab === 'additional' && (
                        <motion.div
                          key="additional"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type Role */}
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                Tipo de rol
                              </label>
                              <input
                                type="text"
                                name="type_rol"
                                value={formData.type_rol}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                              />
                            </div>

                            {/* Profile Picture URL */}
                            <div>
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                                URL de foto de perfil
                              </label>
                              <input
                                type="url"
                                name="profile_picture_url"
                                value={formData.profile_picture_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 text-[#6C757D] dark:text-white/70 bg-white dark:bg-[#1E2329] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                      disabled={isLoading}
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0A2540]/20 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4" />
                          <span>Crear Usuario</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
