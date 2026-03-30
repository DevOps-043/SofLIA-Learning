import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireInstructor } from '@/lib/auth/requireAdmin'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth

    // Cliente con service role key para bypass de RLS (dentro de la función para evitar error en build)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const signatureName = formData.get('signatureName') as string | null

    // Si se proporciona un nombre de firma (texto), guardarlo en la base de datos
    if (signatureName && signatureName.trim().length > 0) {
      // Guardar el nombre de firma en la tabla users
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          signature_name: signatureName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', auth.userId)

      if (updateError) {
        return NextResponse.json(
          { 
            error: 'Error al guardar el nombre de firma',
            details: updateError.message 
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        signatureName: signatureName.trim(),
        message: 'Nombre de firma guardado exitosamente'
      })
    }

    // Si se proporciona un archivo (imagen de firma)
    if (!file) {
      return NextResponse.json(
        { error: 'Debe proporcionar un archivo de imagen o un nombre de firma' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten imágenes (PNG, JPEG, JPG, GIF, WebP, SVG)' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 5MB' },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `${auth.userId}-signature-${Date.now()}.${fileExt}`
    const filePath = `${auth.userId}/${fileName}`

    // Subir archivo al bucket Certificate-Signatures
    const { data, error: uploadError } = await supabase.storage
      .from('Certificate-Signatures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      return NextResponse.json(
        { 
          error: 'Error al subir la firma',
          details: uploadError.message 
        },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('Certificate-Signatures')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Error al obtener la URL pública de la firma' },
        { status: 500 }
      )
    }

    // Guardar la URL de la firma en la tabla users
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        signature_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', auth.userId)

    if (updateError) {
      // No fallar si no se puede guardar en la BD, pero sí retornar la URL
      // para que el cliente pueda guardarla localmente
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: data.path,
      message: 'Firma subida exitosamente'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

