interface GeocodeAddressData {
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  state?: string;
}

export async function geocodeAddress(
  data: GeocodeAddressData,
  orgSlug: string
): Promise<{ lat: string; lon: string } | null> {
  const parts = [data.address, data.city, data.state, data.postal_code, data.country]
    .filter((part) => typeof part === 'string' && part.trim().length > 0);

  if (parts.length === 0) return null;

  const response = await fetch(`/api/${orgSlug}/business/hierarchy/geocode`, {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (!json.success || !json.coordinates) return null;

  return {
    lat: json.coordinates.lat.toString(),
    lon: json.coordinates.lon.toString(),
  };
}
