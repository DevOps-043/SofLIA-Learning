export const INDUSTRY_OPTIONS = [
  'Tecnolog\u00eda e IT',
  'Manufactura e Industria',
  'Salud y Farmac\u00e9utica',
  'Servicios Financieros y Banca',
  'Retail y Comercio',
  'Educaci\u00f3n',
  'Log\u00edstica y Transporte',
  'Construcci\u00f3n e Inmobiliaria',
  'Alimentos y Bebidas',
  'Marketing y Publicidad',
  'Consultor\u00eda y Servicios Profesionales',
  'Energ\u00eda y Recursos Naturales',
  'Telecomunicaciones',
  'Turismo y Hospitalidad',
  'Gobierno y Sector P\u00fablico',
  'ONG y Sector Social',
  'Otro',
].map((value) => ({ label: value, value }))

export const COMPANY_SIZE_OPTIONS = [
  { label: '1 \u2013 10 empleados', value: '1-10' },
  { label: '11 \u2013 50 empleados', value: '11-50' },
  { label: '51 \u2013 200 empleados', value: '51-200' },
  { label: '201 \u2013 1,000 empleados', value: '201-1000' },
  { label: '1,001 \u2013 5,000 empleados', value: '1001-5000' },
  { label: 'M\u00e1s de 5,000 empleados', value: '5000+' },
]

export const COMPANY_TYPE_OPTIONS = [
  { label: 'B2B \u2013 Empresa a Empresa', value: 'B2B' },
  { label: 'B2C \u2013 Empresa a Consumidor', value: 'B2C' },
  { label: 'Mixto \u2013 B2B y B2C', value: 'Mixto' },
  { label: 'Empresa P\u00fablica / Gubernamental', value: 'P\u00fablica' },
  { label: 'ONG / Sin fines de lucro', value: 'ONG' },
]
