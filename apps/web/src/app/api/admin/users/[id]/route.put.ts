import { NextRequest, NextResponse } from 'next/server'

import { AdminUsersService } from '@/features/admin/services/adminUsers.service'

import { requireAdmin } from '@/lib/auth/requireAdmin'

import { UpdateUserSchema } from '@/lib/schemas/user.schema'

import { z } from 'zod'

function getErrorDetails(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('details' in error)) {
    return null
  }

  const { details } = error
  return typeof details === 'string' ? details : null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: userId } = await params
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const userData = UpdateUserSchema.parse(body)
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const updatedUser = await AdminUsersService.updateUser(
      userId, 
      userData, 
      adminUserId,
      { ip, userAgent }
    )

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    // ✅ SEGURIDAD: Manejo específico de errores de validación
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}
