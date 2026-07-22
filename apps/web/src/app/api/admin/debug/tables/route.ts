import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()

    // `information_schema.tables` es un catálogo interno de Postgres, no una tabla
    // del esquema `public`, por lo que queda deliberadamente fuera de los tipos
    // generados. Se accede a través de un cliente sin tipar acotado SOLO a esta
    // consulta de metadatos; la fila devuelta se estrecha a la forma que usamos.
    const metadataClient = supabase as unknown as {
      from: (relation: string) => {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string,
          ) => {
            order: (
              column: string,
            ) => Promise<{
              data: Array<{ table_name: string }> | null
              error: { message: string } | null
            }>
          }
        }
      }
    }

    const { data: tables, error } = await metadataClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      logError('GET /api/admin/debug/tables - database query', error)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener información de tablas',
        tables: []
      })
    }

    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.table_name) || []
    })
  } catch (error) {
    logError('GET /api/admin/debug/tables', error)
    return NextResponse.json({
      success: false,
      ...formatApiError(error, 'Error al obtener información de tablas'),
      tables: []
    })
  }
}
