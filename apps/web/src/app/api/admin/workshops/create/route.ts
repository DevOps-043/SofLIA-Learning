import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { AdminWorkshopsService } from '@/features/admin/services/adminWorkshops.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { z } from 'zod'

// Schema para crear taller desde el panel de admin (basado en la estructura de courses)
const CreateWorkshopAdminSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000, 'La descripción no puede exceder 2000 caracteres'),
  category: z.string().min(1, 'La categoría es requerida'),
  level: z.string().min(1, 'El nivel es requerido'),
  duration_total_minutes: z.number().int('La duración debe ser un número entero').min(1, 'La duración debe ser mayor a 0'),
  instructor_id: z.string().uuid('ID de instructor inválido'),
  is_active: z.boolean().optional().default(false),
  thumbnail_url: z.union([z.string().url('URL de imagen inválida'), z.literal(''), z.null()]).optional(),
  slug: z.string().min(1, 'El slug es requerido'),
  price: z.number().min(0, 'El precio no puede ser negativo').optional().default(0),
  learning_objectives: z.array(z.any()).optional().default([])
})

export async function POST(request: NextRequest) {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    // ✅ SEGURIDAD: Validar datos de entrada con Zod
    const body = await request.json()
    const workshopData = CreateWorkshopAdminSchema.parse(body)
    
    // ✅ SEGURIDAD: Usar ID real del administrador autenticado
    const adminUserId = auth.userId
    
    // Obtener información de la request para auditoría
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'


    const startTime = Date.now();
    
    const newWorkshop = await AdminWorkshopsService.createWorkshop(
      workshopData, 
      adminUserId,
      { ip, userAgent }
    )

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verificar si se guardaron traducciones en la BD
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: translations, error: translationError } = await supabase
        .from('content_translations')
        .select('*')
        .eq('entity_type', 'course')
        .eq('entity_id', newWorkshop.id);

      return NextResponse.json({
        success: true,
        workshop: newWorkshop,
        translationStatus: {
          executed: true,
          translationsFound: translations?.length || 0,
          duration: `${duration}ms`
        }
      });
    } catch (verifyError) {
      console.error('[API /admin/workshops/create] Error verificando traducciones:', verifyError);
      return NextResponse.json({
        success: true,
        workshop: newWorkshop,
        translationStatus: {
          executed: true,
          verificationError: verifyError instanceof Error ? verifyError.message : 'Unknown error'
        }
      });
    }
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
    
    logger.error('Error in POST /api/admin/workshops/create:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear taller' },
      { status: 500 }
    )
  }
}
