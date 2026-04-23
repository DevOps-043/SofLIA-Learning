import { NextResponse } from 'next/server'

export function handleCourseImportDiagnosticsRequest() {
  return NextResponse.json(
    {
      status: 'active',
      service: 'soflia-learning-import-api',
      timestamp: new Date().toISOString(),
      config: {
        auth_configured: !!process.env.COURSEFORGE_API_KEY,
        db_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
    { status: 200 },
  )
}

export function createPingResponse() {
  return NextResponse.json(
    {
      message: 'Pong: Connection Successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    { status: 200 },
  )
}
