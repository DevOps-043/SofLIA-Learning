import { NextResponse } from 'next/server';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { withCacheHeaders } from '@/lib/utils/cache-headers';

const RELEASES_API = 'https://api.github.com/repos/DevOps-043/PulseHub-SofLIA-releases/releases';

/**
 * Catálogo de versiones de Pulse Hub para la página de descargas.
 *
 * UN SOLO NIVEL DE CACHÉ: el CDN. La ruta NO se cachea en Next.
 *
 * Antes convivían dos TTL independientes —`export const revalidate = 600` en la
 * ruta y `s-maxage=300, stale-while-revalidate=600` en la respuesta— que se
 * SUMABAN: publicar un release podía tardar hasta ~25 minutos en verse, y ese
 * número no era deducible leyendo ninguno de los dos sitios. Con la caché en un
 * único nivel, la ventana de retraso es exactamente la declarada abajo.
 */
export const dynamic = 'force-dynamic';

/**
 * Ventana de caché en el CDN.
 *
 * El límite lo pone GitHub, no el producto: sin autenticar son 60 peticiones por
 * hora e IP. Con 120 s de frescura, el CDN (caché global y compartida) golpea el
 * origen como máximo 30 veces por hora, la mitad del cupo. `stale-while-
 * revalidate` se mantiene corto a propósito: es la ventana en la que se puede
 * seguir sirviendo la versión anterior mientras se refresca por detrás, así que
 * el retraso máximo real es la suma de ambos (~4 min).
 *
 * Si se configura `GITHUB_TOKEN` el cupo sube a 5.000/h y estos números pueden
 * bajarse con seguridad.
 */
const RELEASES_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=120',
  'CDN-Cache-Control': 'max-age=120',
} as const;

/**
 * Token opcional de solo lectura. Sin él la ruta funciona igual, pero el cupo de
 * 60 peticiones/hora de GitHub se agota con facilidad y la página de descargas
 * pasa a mostrar el error de rate limit en lugar de la última versión.
 */
function buildGithubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN?.trim();

  return {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function GET() {
  try {
    const res = await fetchWithCircuitBreaker('github-releases', RELEASES_API, {
      // La caché de datos de Next añadiría un tercer TTL invisible sobre el que
      // las cabeceras de arriba no tienen ningún control.
      cache: 'no-store',
      headers: buildGithubHeaders(),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return withCacheHeaders(NextResponse.json(data), RELEASES_CACHE_HEADERS);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch release data' },
      { status: 502 }
    );
  }
}
