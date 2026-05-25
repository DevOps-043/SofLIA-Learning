import { NextResponse } from 'next/server';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { cacheHeaders, withCacheHeaders } from '@/lib/utils/cache-headers';

const RELEASES_API = 'https://api.github.com/repos/DevOps-043/PulseHub-SofLIA-releases/releases';

export const revalidate = 600;

export async function GET() {
  try {
    const res = await fetchWithCircuitBreaker('github-releases', RELEASES_API, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return withCacheHeaders(NextResponse.json(data), cacheHeaders.semiStatic);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch release data' },
      { status: 502 }
    );
  }
}
