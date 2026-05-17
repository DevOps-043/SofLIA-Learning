const COUNTRY_NORMALIZATION: Record<string, string> = {
  mexico: 'MX',
  méxico: 'MX',
  mx: 'MX',
  mex: 'MX',
  españa: 'ES',
  espana: 'ES',
  spain: 'ES',
  es: 'ES',
  esp: 'ES',
  usa: 'US',
  us: 'US',
  'estados unidos': 'US',
  'united states': 'US',
  america: 'US',
  colombia: 'CO',
  co: 'CO',
  col: 'CO',
  argentina: 'AR',
  ar: 'AR',
  arg: 'AR',
  chile: 'CL',
  cl: 'CL',
  chi: 'CL',
  peru: 'PE',
  perú: 'PE',
  pe: 'PE',
  per: 'PE',
};

export function normalizeCountryCode(countryInput: string | undefined | null): string {
  if (!countryInput) {
    return 'MX';
  }

  const normalized = COUNTRY_NORMALIZATION[countryInput.toLowerCase().trim()];
  return normalized || 'MX';
}
