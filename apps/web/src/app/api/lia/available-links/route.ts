import { NextRequest, NextResponse } from 'next/server';
import { getAvailablePages, getAvailableLinksForSofLIA, type UserRole } from '../../../../lib/lia/page-metadata';
import { SessionService } from '../../../../features/auth/services/session.service';
import { createClient } from '../../../../lib/supabase/server';
import { logger } from '../../../../lib/logger';

/**
 * Endpoint para obtener los links disponibles según el rol del usuario
 * GET /api/lia/available-links
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await SessionService.getCurrentUser();
    
    // Obtener el rol del usuario
    let userRole: UserRole = null;
    
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('platform_role')
        .eq('id', user.id)
        .single();

      if (userData) {
        const role = (userData.platform_role || '').toLowerCase().trim();
        
        // Mapear roles a los tipos esperados
        if (role === 'administrador' || role === 'admin') {
          userRole = 'administrador';
        } else if (role === 'instructor') {
          userRole = 'instructor';
        } else if (role === 'business' || role === 'business user') {
          userRole = role === 'business user' ? 'business user' : 'business';
        } else if (role === 'usuario' || role === 'user') {
          userRole = 'usuario';
        }
      }
    }
    
    // Obtener páginas disponibles según el rol
    const availablePages = getAvailablePages(userRole);
    
    // Formatear para respuesta JSON
    const links = availablePages.map(page => ({
      path: page.path,
      title: page.title,
      description: page.description,
      category: page.category,
      keywords: page.keywords,
      availableActions: page.availableActions,
      relatedPages: page.relatedPages,
      features: page.features || [],
      contentSections: page.contentSections || [],
      specialNotes: page.specialNotes
    }));
    
    // Obtener texto formateado para LIA
    const linksForLIA = getAvailableLinksForSofLIA(userRole);
    
    return NextResponse.json({
      success: true,
      userRole,
      links,
      linksForLIA,
      totalLinks: links.length
    });
  } catch (error) {
    logger.error('Error obteniendo links disponibles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener links disponibles',
        links: [],
        linksForLIA: ''
      },
      { status: 500 }
    );
  }
}

