import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createClient } from '@/lib/supabase/server'
import type { WorkshopRouteContext } from './workshop-detail.types'

export async function GET(
  _request: NextRequest,
  { params }: WorkshopRouteContext,
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id: workshopId } = await params
    const supabase = await createClient()

    const { data: workshop, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        duration_total_minutes,
        instructor_id,
        is_active,
        thumbnail_url,
        slug,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        approval_status,
        approved_by,
        approved_at,
        rejection_reason,
        created_at,
        updated_at
      `)
      .eq('id', workshopId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Workshop not found' },
        { status: 404 },
      )
    }

    let instructorName = null
    if (workshop.instructor_id) {
      const { data: instructor } = await supabase
        .from('users')
        .select('display_name, first_name, last_name, username')
        .eq('id', workshop.instructor_id)
        .single()

      if (instructor) {
        instructorName = instructor.display_name ||
          `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
          instructor.username ||
          'Instructor'
      }
    }

    return NextResponse.json({
      success: true,
      workshop: {
        ...workshop,
        instructor_name: instructorName,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
