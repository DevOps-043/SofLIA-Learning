import type { ResponsiveDataTableColumn } from '@/core/layout'

export interface SmokeMetric {
  id: string
  label: string
  value: string
  detail: string
}

export interface SmokeWorkshopRow {
  id: string
  title: string
  status: string
  owner: string
  learners: number
  updatedAt: string
}

export interface SmokeUserRow {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastAccess: string
}

export interface SmokeReportRow {
  id: string
  area: string
  owner: string
  completion: number
  learners: number
  updatedAt: string
}

export interface SmokeModule {
  id: string
  title: string
  duration: string
  lessons: number
  status: string
}

export const smokeMetrics: SmokeMetric[] = [
  {
    id: 'active-users',
    label: 'Usuarios activos',
    value: '2,148',
    detail: '+18% vs. mes anterior',
  },
  {
    id: 'completion-rate',
    label: 'Cursos completados',
    value: '84%',
    detail: 'Objetivo trimestral cumplido',
  },
  {
    id: 'open-incidents',
    label: 'Alertas abiertas',
    value: '12',
    detail: '3 requieren atencion hoy',
  },
  {
    id: 'automation-health',
    label: 'Salud operativa',
    value: '99.4%',
    detail: 'Sin degradacion critica',
  },
]

export const smokeWorkshopRows: SmokeWorkshopRow[] = [
  {
    id: 'ws-1',
    title: 'Fundamentos del perfil challenger para equipos comerciales',
    status: 'Publicado',
    owner: 'Ana Salazar',
    learners: 184,
    updatedAt: '10 abr 2026',
  },
  {
    id: 'ws-2',
    title: 'Coreografia comercial: disenando narrativas de venta',
    status: 'Borrador',
    owner: 'Marco Flores',
    learners: 96,
    updatedAt: '09 abr 2026',
  },
  {
    id: 'ws-3',
    title: 'Personalizacion estrategica para cuentas enterprise',
    status: 'Publicado',
    owner: 'Daniela Ruiz',
    learners: 211,
    updatedAt: '07 abr 2026',
  },
]

export const smokeUserRows: SmokeUserRow[] = [
  {
    id: 'usr-1',
    name: 'Jimena Ortega',
    email: 'jimena@soflia.dev',
    role: 'Administrador',
    status: 'Activo',
    lastAccess: 'Hoy, 09:48',
  },
  {
    id: 'usr-2',
    name: 'Luis Padilla',
    email: 'luis@soflia.dev',
    role: 'Instructor',
    status: 'Invitado',
    lastAccess: 'Ayer, 16:12',
  },
  {
    id: 'usr-3',
    name: 'Paula Vera',
    email: 'paula@soflia.dev',
    role: 'Miembro',
    status: 'Activo',
    lastAccess: '08 abr 2026',
  },
]

export const smokeWorkshopColumns: ResponsiveDataTableColumn<SmokeWorkshopRow>[] = [
  {
    id: 'title',
    header: 'Taller',
    mobileOrder: 0,
    cell: (item) => <span className="font-semibold text-[#0A2540] dark:text-white">{item.title}</span>,
  },
  {
    id: 'status',
    header: 'Estado',
    mobileOrder: 1,
    mobileLabel: 'Estado',
    cell: (item) => (
      <span className="inline-flex rounded-full bg-[#00D4B3]/12 px-3 py-1 text-xs font-semibold text-[#0A7F6D] dark:text-[#00D4B3]">
        {item.status}
      </span>
    ),
  },
  {
    id: 'owner',
    header: 'Responsable',
    mobileOrder: 2,
    mobileLabel: 'Responsable',
    cell: (item) => item.owner,
  },
  {
    id: 'learners',
    header: 'Alumnos',
    mobileOrder: 3,
    mobileLabel: 'Alumnos',
    cell: (item) => item.learners.toString(),
  },
  {
    id: 'updatedAt',
    header: 'Actualizado',
    mobileOrder: 4,
    mobileLabel: 'Actualizado',
    cell: (item) => item.updatedAt,
  },
]

export const smokeUserColumns: ResponsiveDataTableColumn<SmokeUserRow>[] = [
  {
    id: 'name',
    header: 'Usuario',
    mobileOrder: 0,
    cell: (item) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0A2540] dark:text-white">{item.name}</p>
        <p className="truncate text-xs text-[#6C757D] dark:text-white/60">{item.email}</p>
      </div>
    ),
  },
  {
    id: 'role',
    header: 'Rol',
    mobileOrder: 1,
    mobileLabel: 'Rol',
    cell: (item) => item.role,
  },
  {
    id: 'status',
    header: 'Estado',
    mobileOrder: 2,
    mobileLabel: 'Estado',
    cell: (item) => item.status,
  },
  {
    id: 'lastAccess',
    header: 'Ultimo acceso',
    mobileOrder: 3,
    mobileLabel: 'Ultimo acceso',
    cell: (item) => item.lastAccess,
  },
]

export const smokeReportRows: SmokeReportRow[] = [
  {
    id: 'rep-1',
    area: 'Ventas consultivas enterprise',
    owner: 'Ana Salazar',
    completion: 84,
    learners: 128,
    updatedAt: '10 abr 2026',
  },
  {
    id: 'rep-2',
    area: 'Onboarding de lideres comerciales',
    owner: 'Marco Flores',
    completion: 67,
    learners: 92,
    updatedAt: '09 abr 2026',
  },
  {
    id: 'rep-3',
    area: 'Habilitacion de equipos regionales',
    owner: 'Jimena Ortega',
    completion: 93,
    learners: 204,
    updatedAt: '07 abr 2026',
  },
]

export const smokeReportColumns: ResponsiveDataTableColumn<SmokeReportRow>[] = [
  {
    id: 'area',
    header: 'Area',
    mobileOrder: 0,
    cell: (item) => <span className="font-semibold text-[#0A2540] dark:text-white">{item.area}</span>,
  },
  {
    id: 'owner',
    header: 'Responsable',
    mobileOrder: 1,
    mobileLabel: 'Responsable',
    cell: (item) => item.owner,
  },
  {
    id: 'completion',
    header: 'Avance',
    mobileOrder: 2,
    mobileLabel: 'Avance',
    cell: (item) => `${item.completion}%`,
  },
  {
    id: 'learners',
    header: 'Usuarios',
    mobileOrder: 3,
    mobileLabel: 'Usuarios',
    cell: (item) => item.learners.toString(),
  },
  {
    id: 'updatedAt',
    header: 'Actualizado',
    mobileOrder: 4,
    mobileLabel: 'Actualizado',
    cell: (item) => item.updatedAt,
  },
]

export const smokeModules: SmokeModule[] = [
  {
    id: 'mod-1',
    title: 'Fundamentos del perfil challenger: mas alla de la objecion clasica',
    duration: '1h 38m',
    lessons: 6,
    status: 'Publicado',
  },
  {
    id: 'mod-2',
    title: 'Coreografia comercial: disenando narrativas para ventas complejas',
    duration: '2h 40m',
    lessons: 4,
    status: 'Publicado',
  },
  {
    id: 'mod-3',
    title: 'Personalizacion estrategica para cuentas enterprise con multiples stakeholders',
    duration: '58m',
    lessons: 3,
    status: 'Borrador',
  },
]
