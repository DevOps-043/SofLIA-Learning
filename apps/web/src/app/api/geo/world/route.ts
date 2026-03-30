import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Intentar cargar desde múltiples fuentes de GeoJSON
    const sources = [
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
      'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json',
      'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
    ]

    for (const source of sources) {
      try {
        // Crear un timeout manual
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(source, {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          
          // Verificar que es un GeoJSON válido
          if (data.type === 'FeatureCollection' && data.features && Array.isArray(data.features)) {
            return NextResponse.json(data, {
              headers: {
                'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache por 24 horas
              },
            })
          }
        }
      } catch (err: any) {
        // Limpiar timeout si existe
        if (err.name !== 'AbortError') {
          // Continuar con la siguiente fuente si esta falla
          }
        continue
      }
    }

    // Si todas las fuentes fallan, retornar un GeoJSON vacío
    return NextResponse.json({
      type: 'FeatureCollection',
      features: [],
      error: 'No se pudo cargar el mapa desde ninguna fuente disponible.'
    })
  } catch (error) {
    return NextResponse.json(
      {
        type: 'FeatureCollection',
        features: [],
        error: 'Error al cargar el mapa'
      },
      { status: 500 }
    )
  }
}

