import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Obtener información del usuario (puede ser null para usuarios anónimos)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Obtener IP y User Agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // Verificar si ya existe una vista reciente del mismo usuario/IP
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: existingView, error: checkError } = await supabase
      .from('reel_views')
      .select('id')
      .eq('reel_id', id)
      .eq('ip_address', ip)
      .gte('viewed_at', fiveMinutesAgo)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    // Si no hay vista reciente, registrar nueva vista
    if (!existingView) {
      const { error: insertError } = await supabase
        .from('reel_views')
        .insert({
          reel_id: id,
          user_id: user?.id || null,
          ip_address: ip,
          user_agent: userAgent,
          watch_duration_seconds: 0 // Se puede actualizar después
        })

      if (insertError) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      // Incrementar contador en tabla reels
      const { data: currentReel, error: fetchError } = await supabase
        .from('reels')
        .select('view_count')
        .eq('id', id)
        .single()

      if (fetchError) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }

      const newViewCount = (currentReel.view_count || 0) + 1
      
      const { error: incrementError } = await supabase
        .from('reels')
        .update({ 
          view_count: newViewCount
        })
        .eq('id', id)

      if (incrementError) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
