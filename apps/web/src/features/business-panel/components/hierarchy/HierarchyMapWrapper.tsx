'use client'

import dynamic from 'next/dynamic'
import { Map } from 'lucide-react'
import styles from './HierarchyExperience.module.css'

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

const MapLoadingPlaceholder = () => (
  <div className={styles.mapLoading} aria-live="polite">
    <Map aria-hidden="true" />
    <p>Preparando mapa…</p>
  </div>
)

const HierarchyMapComponent = dynamic(
  () => import('./HierarchyMap').then((module) => module.default),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />,
  },
)

export function HierarchyMapWrapper({ points, center, zoom }: HierarchyMapWrapperProps) {
  return (
    <div className={styles.mapContainer}>
      <HierarchyMapComponent points={points} center={center} zoom={zoom} />
    </div>
  )
}
