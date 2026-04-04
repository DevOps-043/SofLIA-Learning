import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrganizationBySlug } from '@/features/auth/services/organization.service';

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Error al obtener estilos'
}

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
    const organization = await getOrganizationBySlug(slug);

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
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
