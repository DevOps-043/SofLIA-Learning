import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface OrganizationTemplateUser {
  role: string | null
  job_title: string | null
  users:
    | {
        username: string | null
        email: string | null
        first_name: string | null
        last_name: string | null
        display_name: string | null
      }
    | Array<{
        username: string | null
        email: string | null
        first_name: string | null
        last_name: string | null
        display_name: string | null
      }>
    | null
}

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // Obtener usuarios reales de la organización
    // Se usa la relación explícita porque hay múltiples FK hacia users (user_id, invited_by)
    const { data: orgUsers, error } = await supabase
      .from('organization_users')
      .select(`
        role,
        job_title,
        users:users!organization_users_user_id_fkey (
          username,
          email,
          first_name,
          last_name,
          display_name
        )
      `)
      .eq('organization_id', auth.organizationId)

    if (error) {
      console.error('Error fetching organization users for template:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener usuarios de la organización'
        },
        { status: 500 }
      )
    }

    // Headers del CSV
    const csvHeaders = [
      'username',
      'email',
      'first_name',
      'last_name',
      'display_name',
      'job_title',
      'org_role',
      'password'
    ]

    // Construir filas del CSV
    const csvRows = (orgUsers || []).map((orgUser: OrganizationTemplateUser) => {
      // Supabase devuelve un array si la relación es one-to-many, pero user_id es FK única aquí.
      // Sin embargo, a veces devuelve array si no se especifica !inner o single. 
      // Asumiremos que 'users' es un objeto u objeto en array.
      const userData = Array.isArray(orgUser.users) ? orgUser.users[0] : orgUser.users

      const username = userData?.username || ''
      const email = userData?.email || ''
      const firstName = userData?.first_name || ''
      const lastName = userData?.last_name || ''
      const displayName = userData?.display_name || ''
      const jobTitle = orgUser.job_title || ''
      const role = orgUser.role || 'member'

      // Placeholder para la contraseña (cifrada/protegida)
      const password = '****************'

      const escapeCsv = (val: string) => {
        if (!val) return ''
        const stringVal = String(val)
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`
        }
        return stringVal
      }

      return [
        escapeCsv(username),
        escapeCsv(email),
        escapeCsv(firstName),
        escapeCsv(lastName),
        escapeCsv(displayName),
        escapeCsv(jobTitle),
        role,
        password
      ].join(',')
    })

    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="usuarios-organizacion.csv"',
      },
    })
  } catch (error) {
    console.error('Error in users template route:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al generar el archivo'
      },
      { status: 500 }
    )
  }
}
