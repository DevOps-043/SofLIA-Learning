import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

/**
 * GET /api/skills
 * Obtiene todas las skills disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active') !== 'false'

    let query = supabase
      .from('skills')
      .select(SELECT_COLUMNS.skills)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (isActive) {
      query = query.eq('is_active', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: skills, error } = await query

    if (error) {
      logger.error('Error fetching skills:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener skills'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skills: skills || []
    })
  } catch (error) {
    logger.error('💥 Error in /api/skills GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

