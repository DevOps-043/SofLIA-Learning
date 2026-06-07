import { NextRequest } from 'next/server'
import { PUT } from './route.put'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH - Actualización parcial (retrocompatibilidad)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params })
}
