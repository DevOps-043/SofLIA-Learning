'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrganizationNode, OrganizationNodeProperties } from '../../../types/dynamicHierarchy.types'
import { HierarchyService } from '../../../services/hierarchy.service'
import type { NodeManagerUser } from './node-form.utils'
import { toManagerUser } from './node-form.utils'

export interface NodeFormState {
  name: string
  type: string
  customType: string
  street: string
  externalNumber: string
  internalNumber: string
  neighborhood: string
  zipCode: string
  city: string
  nodeState: string
  country: string
  latitude: string
  longitude: string
  managerId: string | null
  managerSearch: string
  managerResults: NodeManagerUser[]
  isSearchingManager: boolean
  selectedManager: NodeManagerUser | null
  loading: boolean
  saveError: string | null
}

export interface NodeFormActions {
  setName: (v: string) => void
  setType: (v: string) => void
  setCustomType: (v: string) => void
  setStreet: (v: string) => void
  setExternalNumber: (v: string) => void
  setInternalNumber: (v: string) => void
  setNeighborhood: (v: string) => void
  setZipCode: (v: string) => void
  setCity: (v: string) => void
  setNodeState: (v: string) => void
  setCountry: (v: string) => void
  setLatitude: (v: string) => void
  setLongitude: (v: string) => void
  setManagerId: (v: string | null) => void
  setManagerSearch: (v: string) => void
  setManagerResults: (v: NodeManagerUser[]) => void
  setSelectedManager: (v: NodeManagerUser | null) => void
  setLoading: (v: boolean) => void
  setSaveError: (v: string | null) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

export function useNodeFormState(
  isOpen: boolean,
  mode: 'create' | 'edit',
  onSave: (name: string, type: string, properties?: OrganizationNodeProperties, managerId?: string) => Promise<void>,
  onClose: () => void,
  parentNode?: OrganizationNode,
  nodeToEdit?: OrganizationNode,
): NodeFormState & NodeFormActions {
  const { t } = useTranslation('business')
  const [name, setName] = useState('')
  const [type, setType] = useState('custom')
  const [customType, setCustomType] = useState('')

  const [street, setStreet] = useState('')
  const [externalNumber, setExternalNumber] = useState('')
  const [internalNumber, setInternalNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [city, setCity] = useState('')
  const [nodeState, setNodeState] = useState('')
  const [country, setCountry] = useState('')

  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  const [managerId, setManagerId] = useState<string | null>(null)
  const [managerSearch, setManagerSearch] = useState('')
  const [managerResults, setManagerResults] = useState<NodeManagerUser[]>([])
  const [isSearchingManager, setIsSearchingManager] = useState(false)
  const [selectedManager, setSelectedManager] = useState<NodeManagerUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    if (mode === 'edit' && nodeToEdit) {
      setName(nodeToEdit.name)
      if (['root', 'region', 'zone', 'team'].includes(nodeToEdit.type.toLocaleLowerCase())) {
        setType(nodeToEdit.type)
        setCustomType('')
      } else {
        setType('custom')
        setCustomType(nodeToEdit.type)
      }

      const props = nodeToEdit.properties || {}
      setStreet(props.street || '')
      setExternalNumber(props.external_number || '')
      setInternalNumber(props.internal_number || '')
      setNeighborhood(props.neighborhood || '')
      setZipCode(props.zip_code || '')
      setCity(props.city || '')
      setNodeState(props.state || '')
      setCountry(props.country || '')

      if (!props.street && props.address) setStreet(props.address)

      setLatitude(props.latitude ? String(props.latitude) : '')
      setLongitude(props.longitude ? String(props.longitude) : '')

      if (nodeToEdit.manager_id) {
        setManagerId(nodeToEdit.manager_id)
        if (nodeToEdit.manager) setSelectedManager(toManagerUser(nodeToEdit.manager))
      } else {
        setManagerId(null)
        setSelectedManager(null)
      }
    } else {
      setName('')
      setCustomType('')
      setManagerId(null)
      setSelectedManager(null)
      setManagerSearch('')
      setManagerResults([])
      setStreet('')
      setExternalNumber('')
      setInternalNumber('')
      setNeighborhood('')
      setZipCode('')
      setCity('')
      setNodeState('')
      setCountry('')
      setLatitude('')
      setLongitude('')

      if (parentNode) {
        if (parentNode.type === 'root') setType('region')
        else if (parentNode.type === 'region') setType('zone')
        else if (parentNode.type === 'zone') setType('team')
        else setType('custom')
      } else {
        setType('custom')
      }
    }
    setLoading(false)
  }, [isOpen, mode, nodeToEdit, parentNode])

  useEffect(() => {
    if (!isOpen) return

    const searchUsers = async () => {
      setIsSearchingManager(true)
      try {
        const users = await HierarchyService.searchOrganizationUsers(managerSearch)
        setManagerResults(users)
      } catch (error) {
        techDebtLogger.error('Failed to search managers', error)
      } finally {
        setIsSearchingManager(false)
      }
    }

    const timeoutId = setTimeout(() => {
      if (managerSearch || !selectedManager) searchUsers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [managerSearch, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const finalType = type === 'custom' ? (customType.trim() || 'custom') : type

      const addressParts = [
        street,
        externalNumber ? `#${externalNumber}` : '',
        internalNumber ? `Int. ${internalNumber}` : '',
        neighborhood ? `Col. ${neighborhood}` : '',
        city,
        nodeState,
      ].filter(Boolean).join(', ')

      const properties: OrganizationNodeProperties = {
        street,
        external_number: externalNumber,
        internal_number: internalNumber,
        neighborhood,
        zip_code: zipCode,
        city,
        state: nodeState,
        country,
        address: addressParts,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      }

      Object.keys(properties).forEach(key => {
        if (properties[key] === null || properties[key] === '') delete properties[key]
      })

      await onSave(name, finalType, properties, managerId || undefined)
      onClose()
    } catch (error) {
      techDebtLogger.error(error)
      setSaveError(t('hierarchy.saveNodeError'))
    } finally {
      setLoading(false)
    }
  }

  return {
    name, type, customType,
    street, externalNumber, internalNumber, neighborhood, zipCode, city, nodeState, country,
    latitude, longitude,
    managerId, managerSearch, managerResults, isSearchingManager, selectedManager, loading, saveError,
    setName, setType, setCustomType,
    setStreet, setExternalNumber, setInternalNumber, setNeighborhood, setZipCode, setCity, setNodeState, setCountry,
    setLatitude, setLongitude,
    setManagerId, setManagerSearch, setManagerResults, setSelectedManager, setLoading, setSaveError,
    handleSubmit,
  }
}
