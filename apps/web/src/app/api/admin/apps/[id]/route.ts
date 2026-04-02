import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { UpdateAppSchema } from '@/lib/schemas/app.schema'
import { createClient } from '../../../../../lib/supabase/server'
import { fromLoose } from '../../../../../lib/supabase/looseQuery'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const supabase = await createClient()

    const { data: app, error } = await appsTable(supabase)
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
      .eq('app_id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    return NextResponse.json({ app })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const supabase = await createClient()
    const body = UpdateAppSchema.parse(await request.json())

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.long_description !== undefined) {
      updateData.long_description = body.long_description
    }
    if (body.category_id !== undefined) updateData.category_id = body.category_id
    if (body.website_url !== undefined) updateData.website_url = body.website_url
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url
    if (body.pricing_model !== undefined) {
      updateData.pricing_model = body.pricing_model
    }
    if (body.pricing_details !== undefined) {
      updateData.pricing_details = body.pricing_details
    }
    if (body.features !== undefined) updateData.features = body.features
    if (body.use_cases !== undefined) updateData.use_cases = body.use_cases
    if (body.advantages !== undefined) updateData.advantages = body.advantages
    if (body.disadvantages !== undefined) {
      updateData.disadvantages = body.disadvantages
    }
    if (body.alternatives !== undefined) updateData.alternatives = body.alternatives
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.supported_languages !== undefined) {
      updateData.supported_languages = body.supported_languages
    }
    if (body.integrations !== undefined) updateData.integrations = body.integrations
    if (body.api_available !== undefined) updateData.api_available = body.api_available
    if (body.mobile_app !== undefined) updateData.mobile_app = body.mobile_app
    if (body.desktop_app !== undefined) updateData.desktop_app = body.desktop_app
    if (body.browser_extension !== undefined) {
      updateData.browser_extension = body.browser_extension
    }
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured
    if (body.is_verified !== undefined) updateData.is_verified = body.is_verified
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: updatedApp, error } = await appsTable(supabase)
      .update(updateData)
      .eq('app_id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update app' }, { status: 500 })
    }

    return NextResponse.json({ app: updatedApp })
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

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const supabase = await createClient()

    const { error } = await appsTable(supabase)
      .delete()
      .eq('app_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
