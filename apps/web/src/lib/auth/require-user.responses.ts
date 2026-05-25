import { NextResponse } from 'next/server'

export function unauthenticatedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'No autenticado. Por favor, inicia sesión.' },
    { status: 401 },
  )
}

export function userNotFoundResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Usuario no encontrado.' },
    { status: 401 },
  )
}

export function bannedUserResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.' },
    { status: 403 },
  )
}

export function internalServerErrorResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Error interno del servidor.' },
    { status: 500 },
  )
}
