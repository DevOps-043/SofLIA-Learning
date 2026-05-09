'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Leaflet icons - ejecutar solo en cliente
const setupLeafletIcons = () => {
  if (typeof window === 'undefined') return

  const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png'
  const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png'
  const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'

  /* eslint-disable no-underscore-dangle */
  delete (L.Icon.Default.prototype as any)._getIconUrl // leaflet internal API — no public type available
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  })
}

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
  enableScrollWheelZoom?: boolean // Toggle para zoom con rueda
}

// Componente interno para cambiar la vista del mapa
// Debe estar separado para usar el hook useMap correctamente dentro del MapContainer
function MapViewController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (map && center) {
    map.setView(center, zoom)
    }
  }, [center, zoom, map])
  
  return null
}

// Componente para controlar el zoom con rueda del mouse
function ScrollWheelZoomController({ enabled }: { enabled: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (enabled) {
      map.scrollWheelZoom.enable()
    } else {
      map.scrollWheelZoom.disable()
    }
  }, [enabled, map])
  
  return null
}

// Componente para control de pantalla completa
function FullscreenControl() {
  const map = useMap()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { t } = useTranslation('business')
  
  const toggleFullscreen = () => {
    const mapContainer = map.getContainer()
    
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().then(() => {
        setIsFullscreen(true)
        // Ajustar el tamaño del mapa cuando entra en pantalla completa
        setTimeout(() => {
          map.invalidateSize()
        }, 100)
      }).catch((err) => {
        console.error('Error al entrar en pantalla completa:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
        // Ajustar el tamaño del mapa cuando sale de pantalla completa
        setTimeout(() => {
          map.invalidateSize()
        }, 100)
      }).catch((err) => {
        console.error('Error al salir de pantalla completa:', err)
      })
    }
  }
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [map])
  
  return (
    <div 
      className="leaflet-top leaflet-right" 
      style={{ zIndex: 1000, marginTop: '10px', marginRight: '10px' }}
    >
      <div className="leaflet-control">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? t('hierarchy.map.exitFullscreen') : t('hierarchy.map.fullscreen')}
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: '#1E2329',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '18px',
            padding: 0,
            margin: 0
          }}
          type="button"
        >
          {isFullscreen ? '⤓' : '⤢'}
        </button>
      </div>
    </div>
  )
}


// Componente para renderizar los marcadores
function MapMarkers({ 
  points, 
  goldIcon, 
  defaultIcon 
}: { 
  points: MapPoint[]
  goldIcon: L.Icon
  defaultIcon: L.Icon 
}) {
  const { t } = useTranslation('business')
  return (
    <>
      {points.map((point) => (
        <Marker 
          key={point.id} 
          position={[point.lat, point.lng]}
          icon={point.isTopPerformer ? goldIcon : defaultIcon}
          zIndexOffset={point.isTopPerformer ? 1000 : 0}
        >
          <Popup className="custom-popup dark-popup">
            <div className="min-w-[200px] bg-gradient-to-br from-[#1E2329] to-[#2A2F35] text-white rounded-lg border border-white/10 shadow-xl overflow-hidden">
              {/* Header con gradiente */}
              <div className={`px-4 py-3 border-b border-white/10 relative ${point.isTopPerformer ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'}`}>
                <div className="flex items-center justify-between pr-8">
                  <h3 className="font-bold text-white text-base leading-tight">{point.name}</h3>
                  {point.isTopPerformer && (
                    <span className="text-lg" title={t('hierarchy.map.topPerformer')}>🏆</span>
                  )}
                </div>
                {point.isTopPerformer && (
                  <div className="mt-2 bg-amber-500/30 text-amber-300 text-xs px-2.5 py-1 rounded-full inline-block font-semibold border border-amber-500/40">
                    {t('hierarchy.map.bestPerformance')}
                  </div>
                )}
              </div>
              
              {/* Contenido de estadísticas */}
              {point.stats && (
                <div className="px-4 py-3 bg-white/5">
                  <div>
                    <p className="text-white/70 text-sm font-semibold uppercase tracking-wide mb-1">{point.stats.label}</p>
                    <p className="text-white font-bold text-xl">{point.stats.value}</p>
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

// Loading placeholder
const MapLoadingState = ({ message }: { message?: string }) => {
  const { t } = useTranslation('business')
  return (
  <div className="h-[400px] w-full rounded-2xl bg-[#1E2329] border border-white/10 flex items-center justify-center">
    <div className="text-white/40">{message || t('hierarchy.map.loading')}</div>
  </div>
)}

function HierarchyMap({ points, center = [23.6345, -102.5528], zoom = 5, enableScrollWheelZoom = false }: HierarchyMapProps) {
  const { t } = useTranslation('business')
  const [isReady, setIsReady] = useState(false)
  const [scrollWheelEnabled, setScrollWheelEnabled] = useState(enableScrollWheelZoom)

  // Inicializar iconos de Leaflet y marcar como listo
  useEffect(() => {
    if (typeof window === 'undefined') return
      
    // Setup icons
    setupLeafletIcons()
    
    // Pequeño delay para asegurar que todo esté inicializado
    const timer = requestAnimationFrame(() => {
      setIsReady(true)
    })
      
    return () => cancelAnimationFrame(timer)
  }, [])

  // Crear iconos de forma memoizada
  const { goldIcon, defaultIcon } = useMemo(() => {
    if (typeof window === 'undefined' || !isReady) {
      return { goldIcon: null, defaultIcon: null }
    }
    
    return {
      goldIcon: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
      }),
      defaultIcon: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
      })
    }
  }, [isReady])

  // Calcular centro basado en puntos
  const derivedCenter: [number, number] = useMemo(() => {
    if (points.length === 0) return center
    
    const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length
    const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length
    return [avgLat, avgLng]
  }, [points, center])

  // Estados de carga
  if (typeof window === 'undefined') {
    return <MapLoadingState />
  }

  if (!isReady) {
    return <MapLoadingState message={t('hierarchy.map.initializing')} />
  }
  if (!goldIcon || !defaultIcon) {
    return <MapLoadingState message={t('hierarchy.map.preparing')} />
  }

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 relative">
      <MapContainer 
        key={`hierarchy-map-${derivedCenter[0].toFixed(4)}-${derivedCenter[1].toFixed(4)}`}
        center={derivedCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={scrollWheelEnabled}
      >
        <MapViewController center={derivedCenter} zoom={zoom} />
        
        {/* Control de zoom con rueda del mouse */}
        <ScrollWheelZoomController enabled={scrollWheelEnabled} />
        
        {/* Dark Matter Layer for stylish look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapMarkers 
          points={points} 
          goldIcon={goldIcon} 
          defaultIcon={defaultIcon} 
        />
        
        {/* Control de Escala */}
        <ScaleControl 
          imperial={false}
          position="bottomleft"
        />
        
        {/* Control de Pantalla Completa */}
        <FullscreenControl />
      </MapContainer>
      
      {/* Toggle para habilitar/deshabilitar zoom con rueda */}
      <div 
        className="absolute bottom-2 right-2 z-[1000] bg-[#1E2329] border border-white/20 rounded-lg p-2 flex items-center gap-2"
        style={{ pointerEvents: 'auto' }}
      >
        <label className="flex items-center gap-2 cursor-pointer text-white text-sm">
          <input
            type="checkbox"
            checked={scrollWheelEnabled}
            onChange={(e) => setScrollWheelEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-[#2A2F35] text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <span>{t('hierarchy.map.wheelZoom')}</span>
        </label>
      </div>
    </div>
  )
}

export default HierarchyMap
