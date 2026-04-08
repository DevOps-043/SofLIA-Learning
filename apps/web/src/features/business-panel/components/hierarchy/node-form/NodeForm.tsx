'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, ChevronDown, Plus, Sparkles, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import type { OrganizationNode, OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types'
import { ManagerSelector } from './ManagerSelector'
import { PropertiesFormBuilder } from './PropertiesFormBuilder'
import { useGeocoding } from './useGeocoding'
import { useNodeFormState } from './useNodeFormState'

export interface NodeFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, type: string, properties?: OrganizationNodeProperties, managerId?: string) => Promise<void>
  mode: 'create' | 'edit'
  parentNode?: OrganizationNode
  nodeToEdit?: OrganizationNode
}

export const NodeForm: React.FC<NodeFormProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  parentNode,
  nodeToEdit,
}) => {
  const theme = useBusinessPanelTheme()
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
    }
  )

  if (!isOpen) {
    return null
  }

  const title = mode === 'create'
    ? `Crear dentro de "${parentNode?.name}"`
    : 'Editar componente'

  const sideTitle = mode === 'create' ? 'Configura tu estructura' : 'Refina el diseño'
  const sideDescription = 'Define atributos, responsables y ubicación geográfica para este componente.'

  const fieldClassName =
    'w-full rounded-2xl border-2 px-6 py-4 text-sm font-bold outline-none transition-all'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: theme.overlayBg }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2.5rem] border shadow-2xl"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <div className="hidden w-72 shrink-0 border-r p-10 lg:flex lg:flex-col" style={{ borderColor: theme.borderColor, background: theme.heroBackground }}>
            <div className="space-y-8">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner"
                style={{ backgroundColor: theme.actionSurface }}
              >
                <Building2 className="h-8 w-8" style={{ color: theme.actionColor }} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3" style={{ color: theme.actionColor }} />
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: theme.actionColor }}
                  >
                    Arquitectura
                  </span>
                </div>
                <h2
                  className="text-2xl font-black uppercase italic leading-tight tracking-tighter"
                  style={{ color: theme.inverseTextColor }}
                >
                  {sideTitle}
                </h2>
                <p
                  className="text-xs font-semibold uppercase tracking-wide leading-relaxed"
                  style={{ color: theme.inverseMutedTextColor }}
                >
                  {sideDescription}
                </p>
              </div>

              <div className="space-y-3 pt-8">
                {['Datos básicos', 'Gestión LIA', 'Localización'].map(item => (
                  <div key={item} className="flex items-center gap-3" style={{ color: theme.inverseMutedTextColor }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.actionColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div
              className="z-10 flex shrink-0 items-center justify-between border-b px-8 py-6"
              style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.actionColor }} />
                <h3
                  className="text-[11px] font-black uppercase tracking-[0.25em]"
                  style={{ color: theme.textColor }}
                >
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2.5 transition-colors"
                style={{ color: theme.subtextColor }}
                onMouseEnter={event => {
                  event.currentTarget.style.backgroundColor = theme.hoverBg
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit} className="custom-scrollbar flex-1 space-y-12 overflow-y-auto p-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <label className="ml-1 block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.mutedTextColor }}>
                      Nombre comercial
                    </label>
                    <div className="group relative">
                      <Building2
                        className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors"
                        style={{ color: theme.mutedTextColor }}
                      />
                      <input
                        type="text"
                        value={form.name}
                        onChange={event => form.setName(event.target.value)}
                        placeholder="Ej: Ventas Norte"
                        className={fieldClassName}
                        style={{
                          backgroundColor: theme.inputBg,
                          borderColor: theme.borderColor,
                          color: theme.textColor,
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="ml-1 block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.mutedTextColor }}>
                      Tipo de nivel
                    </label>
                    <div className="relative">
                      <select
                        value={form.type}
                        onChange={event => form.setType(event.target.value)}
                        className={`${fieldClassName} appearance-none cursor-pointer pl-6 pr-10`}
                        style={{
                          backgroundColor: theme.inputBg,
                          borderColor: theme.borderColor,
                          color: theme.textColor,
                        }}
                      >
                        <option value="region">Región</option>
                        <option value="zone">Zona</option>
                        <option value="team">Equipo</option>
                        <option value="custom">Otro / personalizado</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.subtextColor }} />
                    </div>
                  </div>
                </div>

                {form.type === 'custom' ? (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <label className="ml-1 block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.mutedTextColor }}>
                      Especificar tipo
                    </label>
                    <input
                      type="text"
                      value={form.customType}
                      onChange={event => form.setCustomType(event.target.value)}
                      placeholder="Ej: Squad, división..."
                      className={fieldClassName}
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    />
                  </motion.div>
                ) : null}
              </div>

              <div className="pt-4">
                <ManagerSelector
                  selectedManager={form.selectedManager}
                  managerSearch={form.managerSearch}
                  managerResults={form.managerResults}
                  isSearchingManager={form.isSearchingManager}
                  onSearchChange={form.setManagerSearch}
                  onSelectManager={user => {
                    form.setSelectedManager(user)
                    form.setManagerId(user.id)
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

              <div className="border-t pt-4" style={{ borderColor: theme.borderColor }}>
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

            <div
              className="flex shrink-0 items-center justify-end gap-4 border-t px-8 py-6"
              style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
            >
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors"
                style={{ color: theme.subtextColor }}
                disabled={form.loading}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={form.handleSubmit}
                disabled={form.loading || !form.name.trim()}
                className="flex items-center gap-3 rounded-2xl px-12 py-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: theme.actionColor,
                  color: theme.onActionColor,
                  boxShadow: `0 16px 30px ${theme.actionColor}24`,
                }}
              >
                {form.loading ? (
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2"
                    style={{
                      borderColor: `${theme.onActionColor}4D`,
                      borderTopColor: theme.onActionColor,
                    }}
                  />
                ) : (
                  <Plus className="h-4 w-4" strokeWidth={3} />
                )}
                <span>{form.loading ? 'Sincronizando...' : 'Guardar cambios'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
