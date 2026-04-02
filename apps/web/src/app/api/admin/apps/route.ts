import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CreateAppSchema } from '@/lib/schemas/app.schema'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../../lib/slug'
import { createClient } from '../../../../lib/supabase/server'
import { fromLoose } from '../../../../lib/supabase/looseQuery'

interface AdminAppCategoryRow {
  category_id: string
  color: string
  description: string
  icon: string
  name: string
  slug: string
}

interface AdminAppRow {
  advantages: string[] | null
  ai_categories?: AdminAppCategoryRow | null
  alternatives: string[] | null
  api_available: boolean | null
  app_id: string
  browser_extension: boolean | null
  category_id: string | null
  created_at: string
  description: string | null
  desktop_app: boolean | null
  disadvantages: string[] | null
  features: string[] | null
  integrations: string[] | null
  is_active: boolean | null
  is_featured: boolean | null
  is_verified: boolean | null
  like_count: number | null
  logo_url: string | null
  long_description: string | null
  mobile_app: boolean | null
  name: string
  pricing_details: Record<string, unknown> | null
  pricing_model: string | null
  rating: number | null
  rating_count: number | null
  slug: string
  supported_languages: string[] | null
  tags: string[] | null
  updated_at: string
  use_cases: string[] | null
  view_count: number | null
  website_url: string | null
}

function appsTable(client: unknown) {
  return fromLoose<AdminAppRow, Record<string, unknown>>(client, 'ai_apps')
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const { data: apps, error } = await appsTable(supabase)
      .select(`
        app_id,
        name,
        slug,
        description,
        long_description,
        category_id,
        website_url,
        logo_url,
        pricing_model,
        pricing_details,
        features,
        use_cases,
        advantages,
        disadvantages,
        alternatives,
        tags,
        supported_languages,
        integrations,
        api_available,
        mobile_app,
        desktop_app,
        browser_extension,
        is_featured,
        is_verified,
        view_count,
        like_count,
        rating,
        rating_count,
        is_active,
        created_at,
        updated_at,
        ai_categories(
          category_id,
          name,
          slug,
          description,
          icon,
          color
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching admin apps:', error)
      return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 })
    }

    return NextResponse.json({ apps: apps ?? [] })
  } catch (error) {
    logger.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()
    const body = CreateAppSchema.parse(await request.json())

    logger.log('Creando nueva app con datos validados:', body)

    let slug: string
    if (body.slug) {
      slug = sanitizeSlug(body.slug)
    } else if (body.name) {
      slug = sanitizeSlug(body.name)
    } else {
      return NextResponse.json({ error: 'Se requiere nombre o slug' }, { status: 400 })
    }

    slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
      const { data } = await appsTable(supabase)
        .select('slug')
        .eq('slug', testSlug)
        .single()
      return !!data
    })

    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      name: body.name,
      slug,
      description: body.description,
      long_description: body.long_description,
      category_id: body.category_id,
      website_url: body.website_url,
      logo_url: body.logo_url,
      pricing_model: body.pricing_model || 'free',
      pricing_details: body.pricing_details || {},
      features: body.features || [],
      use_cases: body.use_cases || [],
      advantages: body.advantages || [],
      disadvantages: body.disadvantages || [],
      alternatives: body.alternatives || [],
      tags: body.tags || [],
      supported_languages: body.supported_languages || [],
      integrations: body.integrations || [],
      api_available: body.api_available || false,
      mobile_app: body.mobile_app || false,
      desktop_app: body.desktop_app || false,
      browser_extension: body.browser_extension || false,
      is_featured: body.is_featured || false,
      is_verified: body.is_verified || false,
      view_count: 0,
      like_count: 0,
      rating: 0,
      rating_count: 0,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: now,
      updated_at: now,
    }

    const { data: newApp, error } = await appsTable(supabase)
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      logger.error('Error creating app:', error)
      return NextResponse.json({ error: 'Failed to create app' }, { status: 500 })
    }

    logger.log('App creada exitosamente:', newApp)
    return NextResponse.json({ app: newApp }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos invalidos',
          errors: error.errors.map((item) => ({
            field: item.path.join('.'),
            message: item.message,
          })),
        },
        { status: 400 }
      )
    }

    logger.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
