import { NextResponse } from 'next/server'

export function missingSlugResponse() {
  return NextResponse.json(
    { success: false, error: 'Organization slug is required' },
    { status: 400 },
  )
}

export function unauthenticatedResponse() {
  return NextResponse.json(
    { success: false, error: 'Usuario no autenticado' },
    { status: 401 },
  )
}

export function missingOrganizationResponse() {
  return NextResponse.json(
    { success: false, error: 'Error de contexto de organización' },
    { status: 400 },
  )
}

export function errorDashboardResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Error al obtener datos del dashboard',
      stats: { total_assigned: 0, in_progress: 0, completed: 0, certificates: 0 },
      courses: [],
      learningPaths: [],
    },
    { status: 500 },
  )
}
