import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * POST /api/reportes
 * Crear un nuevo reporte de problema
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    
    
    const {
      titulo,
      descripcion,
      categoria,
      prioridad = 'media',
      pagina_url,
      pathname,
      user_agent,
      screen_resolution,
      navegador,
      pasos_reproducir,
      comportamiento_esperado,
      screenshot_data,
      from_lia = false,
      // 👇 NUEVO: Campos de rrweb
      session_recording,
      recording_size,
      recording_duration
    } = body;

    // Validaciones
    if (!titulo || !descripcion || !categoria) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, descripcion, categoria' },
        { status: 400 }
      );
    }

    // Validar categoría
    const categoriasValidas = ['bug', 'sugerencia', 'contenido', 'performance', 'ui-ux', 'otro'];
    if (!categoriasValidas.includes(categoria)) {
      return NextResponse.json(
        { error: `Categoría inválida. Debe ser una de: ${categoriasValidas.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar prioridad
    const prioridadesValidas = ['baja', 'media', 'alta', 'critica'];
    if (!prioridadesValidas.includes(prioridad)) {
      return NextResponse.json(
        { error: `Prioridad inválida. Debe ser una de: ${prioridadesValidas.join(', ')}` },
        { status: 400 }
      );
    }


    // Si hay screenshot, subirlo a Supabase Storage usando service role key
    let screenshot_url = null;
    if (screenshot_data) {
      try {
        // Crear cliente con service role key para bypass de RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        
        if (!supabaseServiceKey) {
          return NextResponse.json(
            { error: 'Configuración del servidor incompleta' },
            { status: 500 }
          );
        }
        
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        // Convertir base64 a buffer
        const base64Data = screenshot_data.split(',')[1] || screenshot_data;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generar nombre único con timestamp y ID de usuario
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileName = `reporte-${user.id}-${timestamp}-${randomId}.jpg`;
        
        // Subir a Storage con service role key (bypass RLS)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('reportes-screenshots')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          // Continuar sin screenshot si falla la subida
        } else {
          // Obtener URL pública
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('reportes-screenshots')
            .getPublicUrl(uploadData.path);
          
          screenshot_url = publicUrlData.publicUrl;
        }
      } catch (error) {
        // Continuar sin screenshot si falla
      }
    }

    // Insertar reporte en la base de datos
    const { data: reporte, error: insertError } = await supabase
      .from('reportes_problemas')
      .insert({
        user_id: user.id,
        titulo: titulo.trim().substring(0, 200),
        descripcion: descripcion.trim(),
        categoria,
        prioridad,
        pagina_url: pagina_url || '',
        pathname: pathname || '',
        user_agent: user_agent || '',
        screen_resolution: screen_resolution || '',
        navegador: navegador || '',
        pasos_reproducir: pasos_reproducir?.trim() || null,
        comportamiento_esperado: comportamiento_esperado?.trim() || null,
        screenshot_url,
        // 👇 NUEVO: Campos de rrweb
        session_recording: session_recording || null,
        recording_size: recording_size || null,
        recording_duration: recording_duration || null,
        metadata: {
          from_lia,
          timestamp: new Date().toISOString()
        }
      } as any)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Error al crear el reporte', details: insertError.message },
        { status: 500 }
      );
    }


    // TODO: Enviar notificación a administradores (opcional)
    // Puedes agregar aquí lógica para notificar por email o sistema de notificaciones

    return NextResponse.json({
      success: true,
      reporte: {
        id: (reporte as any).id,
        titulo: (reporte as any).titulo,
        categoria: (reporte as any).categoria,
        estado: (reporte as any).estado,
        created_at: (reporte as any).created_at
      },
      message: 'Reporte creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reportes
 * Obtener reportes del usuario o todos (si es admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const categoria = searchParams.get('categoria');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verificar si el usuario es admin
    const isAdmin = user.cargo_rol?.toLowerCase().trim() === 'administrador';

    // Construir query
    let query = supabase
      .from('reportes_con_usuario')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Si no es admin, solo ver sus propios reportes
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Aplicar filtros
    if (estado) {
      query = query.eq('estado', estado);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: reportes, error: queryError, count } = await query;

    if (queryError) {
      return NextResponse.json(
        { error: 'Error al obtener reportes', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reportes,
      total: count,
      limit,
      offset,
      isAdmin
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
