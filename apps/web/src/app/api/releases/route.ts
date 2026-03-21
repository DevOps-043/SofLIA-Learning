import { NextResponse } from 'next/server';

const RELEASES_API = 'https://api.github.com/repos/DevOps-043/PulseHub-SofLIA-releases/releases';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(RELEASES_API, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch release data' },
      { status: 502 }
    );
  }
}
