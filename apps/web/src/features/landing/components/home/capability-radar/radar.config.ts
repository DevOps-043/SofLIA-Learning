/**
 * Capability radar data and series palette.
 *
 * Series colors are a categorical DATA palette (not UI theme tokens) validated
 * with the dataviz six-checks script against both the light (#fcfcfb) and dark
 * (#1a1a19) surfaces: lightness band, chroma floor, CVD separation, normal
 * floor and contrast all PASS. Tritan ΔE sits in the 6–8 floor band, so the
 * baseline series always ships with secondary encoding (dashed stroke) plus
 * direct labels and a legend.
 */
export const RADAR_SERIES = {
  now: {
    id: 'now',
    color: '#3D6FC2',
    dash: '6 5',
  },
  soflia: {
    id: 'soflia',
    color: '#009987',
    dash: undefined,
  },
} as const;

export const RADAR_AXES = [
  'strategy',
  'adoption',
  'productivity',
  'skills',
  'measurement',
  'culture',
] as const;

export type RadarAxisKey = (typeof RADAR_AXES)[number];

/** Values on a 0–100 capability scale. */
export const RADAR_VALUES: Record<'now' | 'soflia', Record<RadarAxisKey, number>> = {
  now: {
    strategy: 34,
    adoption: 28,
    productivity: 40,
    skills: 32,
    measurement: 26,
    culture: 30,
  },
  soflia: {
    strategy: 88,
    adoption: 92,
    productivity: 84,
    skills: 90,
    measurement: 86,
    culture: 82,
  },
};

export const RADAR_MAX = 100;
