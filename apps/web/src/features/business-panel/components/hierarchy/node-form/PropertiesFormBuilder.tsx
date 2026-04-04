'use client'

interface PropertiesFormBuilderProps {
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
  loading: boolean
  isGeocoding: boolean
  onStreetChange: (v: string) => void
  onExternalNumberChange: (v: string) => void
  onInternalNumberChange: (v: string) => void
  onNeighborhoodChange: (v: string) => void
  onZipCodeChange: (v: string) => void
  onCityChange: (v: string) => void
  onNodeStateChange: (v: string) => void
  onCountryChange: (v: string) => void
  onLatitudeChange: (v: string) => void
  onLongitudeChange: (v: string) => void
  onGeocode: () => void
  onReverseGeocode: () => void
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm'

export function PropertiesFormBuilder({
  street, externalNumber, internalNumber, neighborhood, zipCode,
  city, nodeState, country, latitude, longitude,
  loading, isGeocoding,
  onStreetChange, onExternalNumberChange, onInternalNumberChange,
  onNeighborhoodChange, onZipCodeChange, onCityChange, onNodeStateChange,
  onCountryChange, onLatitudeChange, onLongitudeChange,
  onGeocode, onReverseGeocode,
}: PropertiesFormBuilderProps) {
  const isDisabled = loading || isGeocoding

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="text-xl">📍</span> Dirección
        </h4>
        {(latitude || longitude) && (
          <button
            type="button"
            onClick={onReverseGeocode}
            disabled={isDisabled}
            className="text-xs text-blue-500 hover:text-blue-400 underline"
          >
            Rellenar desde coordenadas
          </button>
        )}
      </div>

      {/* Street & Numbers */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-6">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calle / Avenida</label>
          <input type="text" value={street} onChange={e => onStreetChange(e.target.value)}
            placeholder="Ej: Av. Reforma" className={inputClass} />
        </div>
        <div className="col-span-6 md:col-span-3">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">No. Ext</label>
          <input type="text" value={externalNumber} onChange={e => onExternalNumberChange(e.target.value)}
            placeholder="123" className={inputClass} />
        </div>
        <div className="col-span-6 md:col-span-3">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">No. Int</label>
          <input type="text" value={internalNumber} onChange={e => onInternalNumberChange(e.target.value)}
            placeholder="PB" className={inputClass} />
        </div>
      </div>

      {/* Neighborhood & Zip */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Colonia / Barrio</label>
          <input type="text" value={neighborhood} onChange={e => onNeighborhoodChange(e.target.value)}
            placeholder="Ej: Juárez" className={inputClass} />
        </div>
        <div className="col-span-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">C.P.</label>
          <input type="text" value={zipCode} onChange={e => onZipCodeChange(e.target.value)}
            placeholder="06600" className={inputClass} />
        </div>
      </div>

      {/* City, State, Country */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ciudad / Municipio</label>
          <input type="text" value={city} onChange={e => onCityChange(e.target.value)}
            placeholder="Cuauhtémoc" className={inputClass} />
        </div>
        <div className="col-span-6 md:col-span-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</label>
          <input type="text" value={nodeState} onChange={e => onNodeStateChange(e.target.value)}
            placeholder="CDMX" className={inputClass} />
        </div>
        <div className="col-span-6 md:col-span-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">País</label>
          <input type="text" value={country} onChange={e => onCountryChange(e.target.value)}
            placeholder="México" className={inputClass} />
        </div>
      </div>

      <button
        type="button"
        onClick={onGeocode}
        disabled={isDisabled || !street || !city}
        className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        🌍 Calcular coordenadas desde campos
      </button>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Latitud</label>
          <input type="number" step={0.000001} value={latitude} onChange={e => onLatitudeChange(e.target.value)}
            placeholder="-34.6037"
            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-mono" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Longitud</label>
          <input type="number" step={0.000001} value={longitude} onChange={e => onLongitudeChange(e.target.value)}
            placeholder="-58.3816"
            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-mono" />
        </div>
      </div>
    </div>
  )
}
