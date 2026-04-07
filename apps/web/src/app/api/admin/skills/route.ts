import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * GET /api/admin/skills
 * Obtiene todas las skills (incluyendo inactivas para administradores)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('skills')
      .select('skill_id, name, slug, description, category, icon_url, icon_type, icon_name, color, level, is_active, is_featured, display_order, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

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
    logger.error('💥 Error in /api/admin/skills GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/skills
 * Crea una nueva skill
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const {
      name,
      slug,
      description,
      category = 'general',
      icon_url,
      icon_type = 'image',
      icon_name,
      color = '#3b82f6',
      level = 'beginner',
      is_active = true,
      is_featured = false,
      display_order = 0
    } = body

    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Nombre y slug son requeridos'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el slug no exista
    const { data: existingSkill } = await supabase
      .from('skills')
      .select('skill_id')
      .eq('slug', slug)
      .single()

    if (existingSkill) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe una skill con ese slug'
      }, { status: 400 })
    }

    const { data: skill, error } = await supabase
      .from('skills')
      .insert({
        name,
        slug,
        description,
        category,
        icon_url,
        icon_type,
        icon_name,
        color,
        level,
        is_active,
        is_featured,
        display_order
      })
      .select('skill_id, name, slug, description, category, icon_url, icon_type, icon_name, color, level, is_active, is_featured, display_order, created_at, updated_at')
      .single()

    if (error) {
      logger.error('Error creating skill:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al crear la skill'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skill
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/skills POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

