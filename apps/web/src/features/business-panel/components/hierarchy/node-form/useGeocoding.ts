'use client'

import { useState } from 'react'
import type { GeocodeResponse, ReverseGeocodeResponse } from './node-form.utils'
import { getErrorMessage } from './node-form.utils'

interface GeocodingState {
  street: string
  externalNumber: string
  neighborhood: string
  city: string
  nodeState: string
  country: string
  zipCode: string
  latitude: string
  longitude: string
}

interface GeocodingSetters {
  setStreet: (v: string) => void
  setExternalNumber: (v: string) => void
  setNeighborhood: (v: string) => void
  setCity: (v: string) => void
  setNodeState: (v: string) => void
  setCountry: (v: string) => void
  setZipCode: (v: string) => void
  setLatitude: (v: string) => void
  setLongitude: (v: string) => void
}

export function useGeocoding(state: GeocodingState, setters: GeocodingSetters) {
  const [isGeocoding, setIsGeocoding] = useState(false)

  const handleGeocode = async () => {
    const { street, externalNumber, neighborhood, city, nodeState, country, zipCode } = state
    const queryParts = [street, externalNumber, neighborhood, city, nodeState, country].filter(Boolean).join(', ')

    if (!queryParts && !city && !street) {
      alert('Por favor complete al menos Calle y Ciudad para buscar coordenadas.')
      return
    }

    setIsGeocoding(true)
    try {
      const res = await fetch('/api/business/hierarchy/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: `${street} ${externalNumber || ''}`.trim(),
          city,
          state: nodeState,
          country,
          postal_code: zipCode,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(errData.error || 'Error en servicio de geocodificación')
      }

      const data = await res.json() as GeocodeResponse
      if (data.success && data.coordinates) {
        setters.setLatitude(String(data.coordinates.lat))
        setters.setLongitude(String(data.coordinates.lon))
      } else {
        alert('No se encontraron coordenadas para esta dirección')
      }
    } catch (e: unknown) {
      console.error(e)
      alert('Error: ' + getErrorMessage(e, 'Intente nuevamente'))
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleReverseGeocode = async () => {
    const { latitude, longitude } = state
    if (!latitude || !longitude) return

    setIsGeocoding(true)
    try {
      const res = await fetch(`/api/business/hierarchy/geocode?lat=${latitude}&lon=${longitude}`)

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Error ${res.status}: ${errText}`)
      }

      const data = await res.json() as ReverseGeocodeResponse
      if (data.error) throw new Error(data.error)

      if (data.address) {
        const addr = data.address
        setters.setStreet(addr.road || addr.pedestrian || addr.street || state.street)
        setters.setExternalNumber(addr.house_number || state.externalNumber)
        setters.setNeighborhood(addr.neighbourhood || addr.suburb || state.neighborhood)
        setters.setCity(addr.city || addr.town || addr.village || addr.municipality || state.city)
        setters.setNodeState(addr.state || state.nodeState)
        setters.setCountry(addr.country || state.country)
        setters.setZipCode(addr.postcode || state.zipCode)
      } else if (data.display_name) {
        setters.setStreet(data.display_name)
      }
    } catch (e: unknown) {
      console.error(e)
      alert('Error al obtener dirección: ' + getErrorMessage(e, 'Intente nuevamente'))
    } finally {
      setIsGeocoding(false)
    }
  }

  return { handleGeocode, handleReverseGeocode, isGeocoding }
}
