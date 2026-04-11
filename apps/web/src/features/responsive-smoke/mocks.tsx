import type { ResponsiveDataTableColumn } from '@/core/layout'
import type { BusinessAnalyticsUser } from '@/features/business-panel/types/analytics.types'
import type { ResponsiveReportColumnDef } from '@/features/business-panel/components/ReportTable'

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

export const smokeReportColumns: ResponsiveReportColumnDef<SmokeReportRow>[] = [
  {
    accessorKey: 'area',
    id: 'area',
    header: 'Area',
    meta: {
      mobileOrder: 0,
      mobileCardTitle: true,
    },
  },
  {
    accessorKey: 'owner',
    id: 'owner',
    header: 'Responsable',
    meta: {
      mobileOrder: 1,
      mobileCardSubtitle: true,
    },
  },
  {
    accessorKey: 'completion',
    id: 'completion',
    header: 'Avance',
    cell: ({ getValue }) => `${getValue<number>()}%`,
    meta: {
      mobileOrder: 2,
      mobileLabel: 'Avance',
    },
  },
  {
    accessorKey: 'learners',
    id: 'learners',
    header: 'Usuarios',
    meta: {
      mobileOrder: 3,
      mobileLabel: 'Usuarios',
    },
  },
  {
    accessorKey: 'updatedAt',
    id: 'updatedAt',
    header: 'Actualizado',
    meta: {
      mobileOrder: 4,
      mobileLabel: 'Actualizado',
    },
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

export const smokeBusinessUsers: BusinessAnalyticsUser[] = [
  {
    user_id: 'bu-1',
    display_name: 'Jimena Ortega',
    name: 'Jimena Ortega',
    first_name: 'Jimena',
    last_name: 'Ortega',
    email: 'jimena@soflia.dev',
    username: 'jimena.ortega',
    role: 'admin',
    profile_picture_url: null,
    courses_assigned: 12,
    courses_completed: 9,
    average_progress: 84,
    total_time_hours: 42,
    total_time_minutes: 2520,
    certificates_count: 4,
    last_login_at: '2026-04-10T09:48:00.000Z',
    last_active: '2026-04-10T09:48:00.000Z',
    joined_at: '2025-06-18T12:00:00.000Z',
    stats: {
      current_streak: 12,
      planner: {
        adherence: 88,
        total_sessions: 18,
        completed_sessions: 16,
        completed: 16,
        pending: 2,
      },
      activity_calendar: [],
      hourly_distribution: [2, 4, 5],
      courses: {
        total_lesson_time_minutes: 840,
        lessons_completed: 28,
        quizzes_completed: 11,
        quizzes_passed: 10,
        notes_count: 14,
        breakdown: [],
      },
      lia: {
        total_conversations: 24,
        total_messages: 164,
        user_messages: 82,
        assistant_responses: 82,
        contexts: {
          ai_chat: 12,
          course: 12,
        },
      },
    },
  },
  {
    user_id: 'bu-2',
    display_name: 'Luis Padilla',
    name: 'Luis Padilla',
    first_name: 'Luis',
    last_name: 'Padilla',
    email: 'luis@soflia.dev',
    username: 'luis.padilla',
    role: 'member',
    profile_picture_url: null,
    courses_assigned: 7,
    courses_completed: 4,
    average_progress: 61,
    total_time_hours: 18,
    total_time_minutes: 1080,
    certificates_count: 1,
    last_login_at: '2026-04-09T17:15:00.000Z',
    last_active: '2026-04-09T17:15:00.000Z',
    joined_at: '2025-09-03T12:00:00.000Z',
    stats: {
      current_streak: 4,
      planner: {
        adherence: 67,
        total_sessions: 12,
        completed_sessions: 8,
        completed: 8,
        pending: 4,
      },
      activity_calendar: [],
      hourly_distribution: [1, 2, 3],
      courses: {
        total_lesson_time_minutes: 420,
        lessons_completed: 12,
        quizzes_completed: 5,
        quizzes_passed: 4,
        notes_count: 7,
        breakdown: [],
      },
      lia: {
        total_conversations: 8,
        total_messages: 42,
        user_messages: 21,
        assistant_responses: 21,
        contexts: {
          ai_chat: 5,
          course: 3,
        },
      },
    },
  },
  {
    user_id: 'bu-3',
    display_name: 'Paula Vera',
    name: 'Paula Vera',
    first_name: 'Paula',
    last_name: 'Vera',
    email: 'paula@soflia.dev',
    username: 'paula.vera',
    role: 'instructor',
    profile_picture_url: null,
    courses_assigned: 15,
    courses_completed: 13,
    average_progress: 93,
    total_time_hours: 56,
    total_time_minutes: 3360,
    certificates_count: 6,
    last_login_at: '2026-04-08T13:40:00.000Z',
    last_active: '2026-04-08T13:40:00.000Z',
    joined_at: '2025-04-22T12:00:00.000Z',
    stats: {
      current_streak: 18,
      planner: {
        adherence: 95,
        total_sessions: 21,
        completed_sessions: 20,
        completed: 20,
        pending: 1,
      },
      activity_calendar: [],
      hourly_distribution: [5, 7, 8],
      courses: {
        total_lesson_time_minutes: 1180,
        lessons_completed: 42,
        quizzes_completed: 16,
        quizzes_passed: 15,
        notes_count: 22,
        breakdown: [],
      },
      lia: {
        total_conversations: 31,
        total_messages: 208,
        user_messages: 104,
        assistant_responses: 104,
        contexts: {
          ai_chat: 16,
          course: 15,
        },
      },
    },
  },
]
