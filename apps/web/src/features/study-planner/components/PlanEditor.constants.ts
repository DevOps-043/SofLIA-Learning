export const DAYS_OF_WEEK = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miÃ©rcoles', label: 'MiÃ©rcoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sÃ¡bado', label: 'SÃ¡bado' },
  { id: 'domingo', label: 'Domingo' }
];

export const SESSION_TYPES = [
  { type: 'short' as const, label: 'Corta', range: '20-35 min', min: 20, max: 35 },
  { type: 'medium' as const, label: 'Media', range: '45-60 min', min: 45, max: 60 },
  { type: 'long' as const, label: 'Larga', range: '75-120 min', min: 75, max: 120 }
];
