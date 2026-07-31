'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import L from 'leaflet'
import { Loader2, Maximize2, MousePointer2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'leaflet/dist/leaflet.css'
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

interface HierarchyMapProps {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
  enableScrollWheelZoom?: boolean
}

type InitialView = {
  center: [number, number]
  zoom: number
}

function createMarkerIcon(isTopPerformer: boolean) {
  const markerClass = isTopPerformer ? 'hierarchy-map-marker hierarchy-map-marker--top' : 'hierarchy-map-marker'
  return L.divIcon({
    className: '',
    html: `<span class="${markerClass}" aria-hidden="true"><span></span></span>`,
    iconAnchor: [16, 32],
    iconSize: [32, 32],
    popupAnchor: [0, -28],
  })
}

function createPopupContent(point: MapPoint, topPerformerLabel: string) {
  const root = document.createElement('div')
  root.className = 'hierarchy-map-popup'

  const title = document.createElement('strong')
  title.textContent = point.name
  root.appendChild(title)

  if (point.isTopPerformer) {
    const status = document.createElement('span')
    status.className = 'hierarchy-map-popup__status'
    status.textContent = topPerformerLabel
    root.appendChild(status)
  }

  if (point.stats) {
    const label = document.createElement('small')
    label.textContent = point.stats.label
    root.appendChild(label)

    const value = document.createElement('b')
    value.textContent = String(point.stats.value)
    root.appendChild(value)
  }

  return root
}

function getDerivedCenter(points: MapPoint[], fallback: [number, number]): [number, number] {
  if (points.length === 0) return fallback
  const latitude = points.reduce((total, point) => total + point.lat, 0) / points.length
  const longitude = points.reduce((total, point) => total + point.lng, 0) / points.length
  return [latitude, longitude]
}

export default function HierarchyMap({
  points,
  center = [23.6345, -102.5528],
  zoom = 5,
  enableScrollWheelZoom = false,
}: HierarchyMapProps) {
  const { t } = useTranslation('business')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerLayerRef = useRef<L.LayerGroup | null>(null)
  const initialViewRef = useRef<InitialView>({ center, zoom })
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instanceKey, setInstanceKey] = useState(0)
  const [scrollWheelEnabled, setScrollWheelEnabled] = useState(enableScrollWheelZoom)
  const validPoints = useMemo(
    () => points.filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
    [points],
  )
  const derivedCenter = useMemo(() => getDerivedCenter(validPoints, center), [center, validPoints])

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    try {
      const map = L.map(container, {
        center: initialViewRef.current.center,
        zoom: initialViewRef.current.zoom,
        scrollWheelZoom: false,
        zoomControl: true,
      })
      mapRef.current = map
      markerLayerRef.current = L.layerGroup().addTo(map)

      const usesDarkTheme = document.documentElement.classList.contains('dark')
      L.tileLayer(
        usesDarkTheme
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19,
        },
      ).addTo(map)
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

      const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }))
      resizeObserver.observe(container)
      requestAnimationFrame(() => {
        map.invalidateSize({ pan: false })
        setIsReady(true)
      })

      return () => {
        resizeObserver.disconnect()
        markerLayerRef.current = null
        mapRef.current = null
        map.remove()
      }
    } catch (mapError) {
      techDebtLogger.error('Unable to initialize hierarchy map', mapError)
      mapRef.current?.remove()
      mapRef.current = null
      markerLayerRef.current = null
      setError(t('hierarchy.map.loading'))
    }
  }, [instanceKey, t])

  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current
    if (!map || !markerLayer || !isReady) return

    markerLayer.clearLayers()
    validPoints.forEach(point => {
      L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(Boolean(point.isTopPerformer)),
        keyboard: true,
        title: point.name,
      })
        .bindPopup(createPopupContent(point, t('hierarchy.map.bestPerformance')))
        .addTo(markerLayer)
    })

    if (validPoints.length === 1) {
      map.setView([validPoints[0].lat, validPoints[0].lng], Math.max(zoom, 10), { animate: false })
    } else if (validPoints.length > 1) {
      const bounds = L.latLngBounds(validPoints.map(point => [point.lat, point.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 11, animate: false })
    } else {
      map.setView(derivedCenter, zoom, { animate: false })
    }
  }, [derivedCenter, isReady, t, validPoints, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (scrollWheelEnabled) map.scrollWheelZoom.enable()
    else map.scrollWheelZoom.disable()
  }, [scrollWheelEnabled, isReady])

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    const map = mapRef.current
    if (!container || !map) return

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
      requestAnimationFrame(() => map.invalidateSize({ pan: false }))
    } catch (fullscreenError) {
      techDebtLogger.error('Unable to toggle hierarchy map fullscreen', fullscreenError)
    }
  }, [])

  if (error) {
    return (
      <div className={styles.mapLoading} role="alert">
        <p>{error}</p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            setError(null)
            setIsReady(false)
            setInstanceKey(current => current + 1)
          }}
        >
          {t('hierarchy.syncing')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={containerRef} className={styles.mapContainer} aria-label={t('hierarchy.map.title')} />
      {!isReady ? (
        <div className={styles.mapLoading} aria-live="polite">
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span>{t('hierarchy.map.initializing')}</span>
        </div>
      ) : null}
      <div className={styles.mapControls}>
        <button
          type="button"
          className={styles.mapControlButton}
          data-active={scrollWheelEnabled}
          onClick={() => setScrollWheelEnabled(current => !current)}
          aria-pressed={scrollWheelEnabled}
        >
          <MousePointer2 aria-hidden="true" />
          <span>{t('hierarchy.map.wheelZoom')}</span>
        </button>
        <button type="button" className={styles.mapControlButton} onClick={() => void toggleFullscreen()}>
          <Maximize2 aria-hidden="true" />
          <span>{t('hierarchy.map.fullscreen')}</span>
        </button>
      </div>
    </div>
  )
}
