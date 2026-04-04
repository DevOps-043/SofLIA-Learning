'use client'

import React from 'react'
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
    ? `Agregar sub-nivel a "${parentNode?.name}"`
    : 'Editar nodo'

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={form.handleSubmit} className="p-5 space-y-5">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={e => form.setName(e.target.value)}
                placeholder="Ej: Ventas Norte"
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Nivel</label>
              <select
                value={form.type}
                onChange={e => form.setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
              >
                <option value="region">Región</option>
                <option value="zone">Zona</option>
                <option value="team">Equipo</option>
                <option value="custom">Personalizado / Otro</option>
              </select>
            </div>

            {form.type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Tipo (Ej: División, Squad)
                </label>
                <input
                  type="text"
                  value={form.customType}
                  onChange={e => form.setCustomType(e.target.value)}
                  placeholder="Especifique el tipo de nivel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            )}
          </div>

          <hr className="border-gray-200 dark:border-neutral-800" />

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

          <hr className="border-gray-200 dark:border-neutral-800" />

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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              disabled={form.loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={form.loading || !form.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {form.loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
