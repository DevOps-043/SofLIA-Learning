import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * GET /api/workshops/[id]/metadata
 * 
 * Obtiene metadatos completos de un taller (módulos y lecciones)
 * para ser usado por LIA en el contexto de talleres
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWorkshopMetadata } from '@/lib/utils/workshop-metadata';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del taller es requerido' },
        { status: 400 }
      );
    }

    // Obtener metadatos del taller dinámicamente desde la BD
    const metadata = await getWorkshopMetadata(id);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Taller no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata
    });
  } catch (error) {
    techDebtLogger.error('Error obteniendo metadatos del taller:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

