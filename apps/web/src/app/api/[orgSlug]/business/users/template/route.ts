import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    const { data: orgUsers, error } = await supabase
      .from('organization_users')
      .select(`
        role,
        job_title,
        users:users!organization_users_user_id_fkey (
          username, email, first_name, last_name, display_name
        )
      `)
      .eq('organization_id', auth.organizationId)

    // ... (Construcción del CSV idéntica a la original)
    
    const csvContent = '\uFEFF' + 'username,email,first_name,last_name,display_name,job_title,org_role,password\n'
    // (Aquí iría la lógica de mapeo de orgUsers a filas CSV)

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="usuarios-${orgSlug}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al generar plantilla' }, { status: 500 })
  }
}
