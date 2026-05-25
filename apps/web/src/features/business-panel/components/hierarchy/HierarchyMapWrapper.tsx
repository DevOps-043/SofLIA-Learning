'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
  isTopPerformer?: boolean
  stats?: {
    value: string | number
    label: string
  }
}

interface HierarchyMapWrapperProps {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
}

// Loading component para el mapa
const MapLoadingPlaceholder = () => (
  <div className="h-[400px] w-full rounded-2xl bg-carbon-800 border border-white/10 flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
  </div>
)

// Wrapper para el mapa que se carga dinámicamente
// IMPORTANTE: Extraer explícitamente el default export para evitar problemas con Context de react-leaflet
const HierarchyMapComponent = dynamic(
  () => import('./HierarchyMap').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />
  }
)

export function HierarchyMapWrapper({ points, center, zoom }: HierarchyMapWrapperProps) {
  const [isClient, setIsClient] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Asegurar que solo se renderice en el cliente después de que el componente esté montado
    setIsClient(true)
  }, [])

  // Asegurar que solo se renderice en el cliente
  if (typeof window === 'undefined' || !isClient) {
    return <MapLoadingPlaceholder />
  }

  // Si hay error, mostrar fallback
  if (hasError) {
    return (
      <div className="h-[400px] w-full rounded-2xl bg-carbon-800 border border-white/10 flex items-center justify-center">
        <div className="text-center text-white/40">
          <p>No se pudo cargar el mapa</p>
          <button
            onClick={() => {
              setHasError(false)
              setIsClient(false)
              setTimeout(() => setIsClient(true), 100)
            }}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div onError={() => setHasError(true)}>
      <HierarchyMapComponent points={points} center={center} zoom={zoom} />
    </div>
  )
}

