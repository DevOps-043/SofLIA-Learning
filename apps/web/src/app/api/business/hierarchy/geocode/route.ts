import { NextRequest, NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

/**
 * POST /api/business/hierarchy/geocode
 * Convierte una dirección en coordenadas (lat/lon) usando OpenStreetMap Nominatim
 * 
 * Body: {
 *   address?: string
 *   city?: string
 *   state?: string
 *   country?: string
 *   postal_code?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación business
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { address, city, state, country, postal_code } = body;

    // Construir query structured para Nominatim (es más preciso)
    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('limit', '1');
    params.append('addressdetails', '1');

    // Si tenemos campos específicos, usarlos
    if (address) params.append('street', address); // address ya trae calle y número
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    if (country) params.append('country', country);
    if (postal_code) params.append('postalcode', postal_code);

    // Check whether at least one location part was provided for the structured query
    const hasStructuredParams = address || city || state || country || postal_code;

    if (!hasStructuredParams) {
      return NextResponse.json(
        { success: false, error: 'Debes proporcionar al menos un campo de ubicación (calle, ciudad, estado, etc.)' },
        { status: 400 }
      );
    }

    logger.info(`🔍 Geocoding request (structured): ${params.toString()}`);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    const response = await fetchWithCircuitBreaker('nominatim-geocode', nominatimUrl, {
      headers: {
        'User-Agent': 'Aprende-y-Aplica/1.0 (contact@aprendeyapla.com)', // Requerido por Nominatim
        'Accept-Language': 'es,en',
        'Referer': request.headers.get('referer') || 'https://aprendeyapla.com'
      }
    });

    if (!response.ok) {
      logger.error(`❌ Nominatim API error (structured): ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: 'Error al conectar con el servicio de geocodificación' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      logger.warn(`⚠️ No se encontró ubicación (Structured)`);

      // Fallback: Intentar búsqueda libre (q) si la estructurada falla
      // A veces la búsqueda estructurada es demasiado estricta
      const parts = [address, city, state, postal_code, country]
        .filter(p => p && typeof p === 'string' && p.trim().length > 0);
      const query = parts.join(', ');

      // Only attempt fallback if there's a query to make
      if (query.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No se pudo encontrar la ubicación. Intenta verificar la calle o el código postal.',
          },
          { status: 200 } // Return 200 to avoid console 404 error
        );
      }

      logger.info(`🔍 Geocoding request (fallback): ${query}`);

      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
      const fallbackRes = await fetchWithCircuitBreaker('nominatim-geocode', fallbackUrl, {
        headers: {
          'User-Agent': 'Aprende-y-Aplica/1.0 (contact@aprendeyapla.com)',
          'Accept-Language': 'es,en',
          'Referer': request.headers.get('referer') || 'https://aprendeyapla.com'
        }
      });

      if (!fallbackRes.ok) {
        logger.error(`❌ Nominatim API error (fallback): ${fallbackRes.status} ${fallbackRes.statusText}`);
        return NextResponse.json(
          { success: false, error: 'Error al conectar con el servicio de geocodificación (fallback)' },
          { status: 500 }
        );
      }

      const fallbackData = await fallbackRes.json();

      if (!fallbackData || !Array.isArray(fallbackData) || fallbackData.length === 0) {
        logger.warn(`⚠️ No se encontró ubicación (Fallback) para: ${query}`);
        return NextResponse.json(
          {
            success: false,
            error: 'No se pudo encontrar la ubicación. Intenta verificar la calle o el código postal.',
          },
          { status: 200 } // Return 200 to avoid console 404 error
        );
      }

      // Found in fallback
      const result = fallbackData[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address
      };

      logger.info(`✅ Geocoding success (fallback): ${coordinates.lat}, ${coordinates.lon} - ${coordinates.display_name}`);
      return NextResponse.json({ success: true, coordinates });
    }

    const result = data[0];
    const coordinates = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address
    };

    logger.info(`✅ Geocoding success: ${coordinates.lat}, ${coordinates.lon} - ${coordinates.display_name}`);

    return NextResponse.json({
      success: true,
      coordinates
    });

  } catch (error) {
    logger.error('❌ Error en geocoding:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al buscar coordenadas'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/business/hierarchy/geocode
 * Reverse Geocoding: Convierte coordenadas (lat/lon) en dirección
 * 
 * Query Params: ?lat=...&lon=...
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;

    const response = await fetchWithCircuitBreaker('nominatim-geocode', url, {
      headers: {
        'User-Agent': 'Aprende-y-Aplica/1.0 (contact@aprendeyapla.com)',
        'Accept-Language': 'es,en',
        'Referer': request.headers.get('referer') || 'https://aprendeyapla.com'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`❌ Reverse Geocoding API error: ${response.status} ${errText}`);
      return NextResponse.json({ error: 'External API Error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: unknown) {
    logger.error('❌ Reverse Geocoding Error:', error);
    const message = error instanceof Error ? error.message : 'Error fetching location';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
