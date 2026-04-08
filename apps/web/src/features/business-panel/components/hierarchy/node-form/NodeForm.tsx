'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Building2, MapPin, Search, ChevronDown } from 'lucide-react'
import type { OrganizationNode, OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types'
import { useNodeFormState } from './useNodeFormState'
import { useGeocoding } from './useGeocoding'
import { ManagerSelector } from './ManagerSelector'
import { PropertiesFormBuilder } from './PropertiesFormBuilder'

export interface NodeFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, type: string, properties?: OrganizationNodeProperties, managerId?: string) => Promise<void>
  mode: 'create' | 'edit'
  parentNode?: OrganizationNode
  nodeToEdit?: OrganizationNode
}

export const NodeForm: React.FC<NodeFormProps> = ({
  isOpen, onClose, onSave, mode, parentNode, nodeToEdit,
}) => {
  const form = useNodeFormState(isOpen, mode, onSave, onClose, parentNode, nodeToEdit)

  const { handleGeocode, handleReverseGeocode, isGeocoding } = useGeocoding(
    {
      street: form.street,
      externalNumber: form.externalNumber,
      neighborhood: form.neighborhood,
      city: form.city,
      nodeState: form.nodeState,
      country: form.country,
      zipCode: form.zipCode,
      latitude: form.latitude,
      longitude: form.longitude,
    },
    {
      setStreet: form.setStreet,
      setExternalNumber: form.setExternalNumber,
      setNeighborhood: form.setNeighborhood,
      setCity: form.setCity,
      setNodeState: form.setNodeState,
      setCountry: form.setCountry,
      setZipCode: form.setZipCode,
      setLatitude: form.setLatitude,
      setLongitude: form.setLongitude,
    },
  )

  if (!isOpen) return null

  const title = mode === 'create'
    ? `APILAR EN "${parentNode?.name}"`
    : 'EDITAR COMPONENTE'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#1E2329] rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-200 dark:border-white/10 max-h-[90vh] flex flex-col"
        >
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar - Visual Guidance */}
            <div className="hidden lg:flex w-72 p-10 flex-col border-r border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-black/10 shrink-0">
               <div className="space-y-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#00D4B3]/10 flex items-center justify-center shadow-inner">
                     <Building2 className="w-8 h-8 text-[#00D4B3]" />
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-[#00D4B3]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00D4B3]">Arquitectura</span>
                     </div>
                     <h2 className="text-2xl font-black text-[#0A2540] dark:text-white leading-tight italic uppercase tracking-tighter">
                        {mode === 'create' ? 'Configura tu Estructura' : 'Refina el Diseño'}
                     </h2>
                     <p className="text-xs font-semibold text-neutral-400 dark:text-white/20 uppercase tracking-wide leading-relaxed">
                        DEFINE LOS ATRIBUTOS, RESPONSABLES Y UBICACIÓN GEOGRÁFICA DE ESTE COMPONENTE.
                     </p>
                  </div>

                  <div className="pt-8 space-y-3">
                     <div className="flex items-center gap-3 text-neutral-300 dark:text-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Datos Básicos</span>
                     </div>
                     <div className="flex items-center gap-3 text-neutral-300 dark:text-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Gestión LIA</span>
                     </div>
                     <div className="flex items-center gap-3 text-neutral-300 dark:text-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Localización</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Panel - Scrollable Form */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#1E2329] z-10 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#00D4B3]" />
                     <h3 className="text-[11px] font-black text-[#0A2540] dark:text-white uppercase tracking-[0.25em]">{title}</h3>
                  </div>
                  <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={form.handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
                  {/* Section 1: Basic Info */}
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 block ml-1">Nombre Comercial</label>
                          <div className="relative group">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 dark:text-white/10 group-focus-within:text-[#00D4B3] transition-colors" />
                              <input
                                type="text"
                                value={form.name}
                                onChange={e => form.setName(e.target.value)}
                                placeholder="Ej: Ventas Norte"
                                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 bg-neutral-50 dark:bg-black/20 border-neutral-100 dark:border-white/5 text-sm font-bold text-[#0A2540] dark:text-white outline-none focus:border-[#00D4B3] transition-all placeholder:text-neutral-300 dark:placeholder:text-white/10"
                                autoFocus
                              />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 block ml-1">Tipo de Nivel</label>
                          <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 dark:text-white/10 group-focus-within:text-[#00D4B3] transition-colors" />
                              <select
                                value={form.type}
                                onChange={e => form.setType(e.target.value)}
                                className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 bg-neutral-50 dark:bg-black/20 border-neutral-100 dark:border-white/5 text-sm font-bold text-[#0A2540] dark:text-white outline-none focus:border-[#00D4B3] transition-all appearance-none cursor-pointer"
                              >
                                <option value="region">Región</option>
                                <option value="zone">Zona</option>
                                <option value="team">Equipo</option>
                                <option value="custom">Otro / Personalizado</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                          </div>
                       </div>
                    </div>

                    {form.type === 'custom' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-white/30 block ml-1">Especificar Tipo</label>
                        <input
                          type="text"
                          value={form.customType}
                          onChange={e => form.setCustomType(e.target.value)}
                          placeholder="Ej: Squad, División..."
                          className="w-full px-6 py-4 rounded-2xl border-2 bg-neutral-50 dark:bg-black/20 border-neutral-100 dark:border-white/5 text-sm font-bold text-[#0A2540] dark:text-white outline-none focus:border-[#00D4B3] transition-all"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Section 2: Manager */}
                  <div className="pt-4">
                    <ManagerSelector
                      selectedManager={form.selectedManager}
                      managerSearch={form.managerSearch}
                      managerResults={form.managerResults}
                      isSearchingManager={form.isSearchingManager}
                      onSearchChange={form.setManagerSearch}
                      onSelectManager={user => {
                        form.setSelectedManager(user)
                        form.setManagerId(user.user_id || user.id)
                        form.setManagerSearch('')
                        form.setManagerResults([])
                      }}
                      onClearManager={() => {
                        form.setSelectedManager(null)
                        form.setManagerId(null)
                        form.setManagerSearch('')
                      }}
                    />
                  </div>

                  {/* Section 3: Properties / Location */}
                  <div className="pt-4 border-t border-neutral-50 dark:border-white/5">
                    <PropertiesFormBuilder
                      street={form.street}
                      externalNumber={form.externalNumber}
                      internalNumber={form.internalNumber}
                      neighborhood={form.neighborhood}
                      zipCode={form.zipCode}
                      city={form.city}
                      nodeState={form.nodeState}
                      country={form.country}
                      latitude={form.latitude}
                      longitude={form.longitude}
                      loading={form.loading}
                      isGeocoding={isGeocoding}
                      onStreetChange={form.setStreet}
                      onExternalNumberChange={form.setExternalNumber}
                      onInternalNumberChange={form.setInternalNumber}
                      onNeighborhoodChange={form.setNeighborhood}
                      onZipCodeChange={form.setZipCode}
                      onCityChange={form.setCity}
                      onNodeStateChange={form.setNodeState}
                      onCountryChange={form.setCountry}
                      onLatitudeChange={form.setLatitude}
                      onLongitudeChange={form.setLongitude}
                      onGeocode={handleGeocode}
                      onReverseGeocode={handleReverseGeocode}
                    />
                  </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-neutral-100 dark:border-white/5 flex justify-end items-center gap-4 bg-white dark:bg-[#1E2329] shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
                    disabled={form.loading}
                  >
                    CERRAR
                  </button>
                  <button
                    onClick={form.handleSubmit}
                    disabled={form.loading || !form.name.trim()}
                    className="px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0A2540] transition-all shadow-xl shadow-[#00D4B3]/20 disabled:opacity-50 active:scale-95 flex items-center gap-3"
                    style={{ background: "#00D4B3" }}
                  >
                    {form.loading ? (
                       <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : <Plus className="w-4 h-4" strokeWidth={3} />}
                    <span>{form.loading ? 'SINCRONIZANDO...' : 'GUARDAR CAMBIOS'}</span>
                  </button>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
