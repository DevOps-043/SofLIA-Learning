import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    const { id } = await params

    // Obtener el reel actual
    const { data: currentReel, error: fetchError } = await supabase
      .from('reels')
      .select('is_featured')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    }

    // Toggle del destacado
    const newFeatured = !currentReel.is_featured

    const { data: updatedReel, error } = await supabase
      .from('reels')
      .update({ 
        is_featured: newFeatured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to toggle reel featured' }, { status: 500 })
    }

    return NextResponse.json(updatedReel)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
