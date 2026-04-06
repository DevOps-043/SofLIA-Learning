'use client'

import { useState, useEffect } from 'react'
import { ResponsiveChoropleth } from '@nivo/geo'
import { useTheme } from '@/core/hooks/useTheme'
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { getChartTheme } from './chart-theme'

interface GeoCountryProperties extends GeoJsonProperties {
  NAME?: string
  name?: string
  NAME_LONG?: string
  name_long?: string
  ADMIN?: string
  admin?: string
  ISO_A3?: string
  ISO3?: string
  iso_a3?: string
  iso3?: string
  ISO_A2?: string
  ISO2?: string
  ISO?: string
  id?: string
}

type WorldMapFeature = Feature<Geometry, GeoCountryProperties>
type WorldMapCollection = FeatureCollection<Geometry, GeoCountryProperties>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isWorldMapCollection(value: unknown): value is WorldMapCollection {
  return (
    isRecord(value) &&
    value.type === 'FeatureCollection' &&
    Array.isArray(value.features)
  )
}

interface ChoroplethChartProps {
  data: Array<{ country: string; count: number }>
  height?: number
  title?: string
}

export function ChoroplethChart({ data, height = 400, title }: ChoroplethChartProps) {
  const { isDark } = useTheme()

  const chartData = data.map(item => ({
    id: item.country,
    value: item.count,
  }))

  const [worldMap, setWorldMap] = useState<WorldMapCollection | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/geo/world')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then((data: unknown) => {
        if (isRecord(data) && data.type === 'Topology') {
          setMapError('Formato de mapa no compatible. Por favor, intente más tarde.')
          return null
        }
        if (isRecord(data) && typeof data.error === 'string') {
          setMapError(data.error)
          return null
        }
        if (isWorldMapCollection(data)) return data
        setMapError('El formato del mapa no es válido. Por favor, intente más tarde.')
        return null
      })
      .then((data) => {
        if (data?.features.length) {
          setWorldMap(data)
          setMapError(null)
        } else {
          setMapError('El mapa está vacío. No hay datos geográficos disponibles.')
        }
        setMapLoading(false)
      })
      .catch(() => {
        setMapError('Error al cargar el mapa. Por favor, intente más tarde.')
        setMapLoading(false)
      })
  }, [])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  if (mapLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  if (mapError || !worldMap || !worldMap.features || worldMap.features.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center p-6">
          <p className="text-gray-500 dark:text-gray-400 mb-2">{mapError || 'Error al cargar el mapa'}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Los datos de países se mostrarán en la tabla de estadísticas</p>
        </div>
      </div>
    )
  }

  const transformedFeatures: WorldMapFeature[] = worldMap.features.map((feature) => {
    const props = feature.properties || {}
    const countryId = (
      props.ISO_A3 ||
      props.ISO3 ||
      props.iso_a3 ||
      props.iso3 ||
      props.ISO_A2 ||
      props.ISO2 ||
      props.ISO ||
      props.id ||
      feature.id ||
      null
    )?.toString().toUpperCase()

    return { ...feature, id: countryId }
  })

  const transformedData = chartData.map(item => ({
    id: item.country.toString().toUpperCase(),
    value: item.count,
  }))

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsiveChoropleth
          data={transformedData}
          features={transformedFeatures}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          colors="purples"
          domain={[0, Math.max(...transformedData.map(d => d.value), 1)]}
          unknownColor={isDark ? '#374151' : '#e5e7eb'}
          label={(feature: WorldMapFeature) =>
            feature.properties?.NAME ||
            feature.properties?.name ||
            feature.properties?.NAME_LONG ||
            feature.properties?.name_long ||
            feature.properties?.ADMIN ||
            feature.properties?.admin ||
            'País'
          }
          valueFormat=".2s"
          projectionTranslation={[0.5, 0.5]}
          projectionRotation={[0, 0, 0]}
          projectionScale={100}
          enableGraticule={true}
          graticuleLineColor={isDark ? '#4b5563' : '#d1d5db'}
          borderWidth={0.5}
          borderColor={isDark ? '#1f2937' : '#ffffff'}
          theme={getChartTheme(isDark)}
          legends={[
            {
              anchor: 'bottom-left',
              direction: 'column',
              justify: true,
              translateX: 20,
              translateY: -40,
              itemsSpacing: 0,
              itemWidth: 94,
              itemHeight: 18,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 18,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: isDark ? '#fff' : '#000',
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}
