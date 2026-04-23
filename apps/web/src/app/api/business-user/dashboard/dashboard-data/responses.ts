import { NextResponse } from 'next/server'

const EMPTY_STATS = {
  total_assigned: 0,
  in_progress: 0,
  completed: 0,
  certificates: 0,
}

export function createDashboardContextErrorResponse(
  status: number,
  error: string,
) {
  return NextResponse.json({ success: false, error }, { status })
}

export function createDashboardFailureResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Error al obtener datos del dashboard',
      stats: EMPTY_STATS,
      courses: [],
    },
    { status: 500 },
  )
}
