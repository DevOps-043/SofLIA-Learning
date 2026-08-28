import { NextRequest, NextResponse } from 'next/server';
import { getPublicAuthOrganizationBySlug } from '@/features/auth/services/organization.service';
import { logger } from '@/lib/logger';

/**
 * GET /api/organizations/[slug]/styles
 * Obtiene los estilos personalizados de una organización por su slug (público)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Slug de organización requerido' },
        { status: 400 }
      );
    }

    // Obtener organización por slug
    const organization = await getPublicAuthOrganizationBySlug(slug);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Retornar solo estilos de login (público)
    return NextResponse.json({
      success: true,
      styles: {
        login: organization.login_styles || null
      }
    });
  } catch (error: unknown) {
    logger.error('Error en GET /api/organizations/[slug]/styles', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estilos' },
      { status: 500 }
    );
  }
}
