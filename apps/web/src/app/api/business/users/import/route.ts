import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

interface ImportResult {
  success: number
  errors: Array<{ row: number; error: string; data: any }>
  total: number
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se proporcionó ningún archivo'
        },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo debe ser un CSV (.csv)'
        },
        { status: 400 }
      )
    }

    // Leer contenido del archivo
    const fileContent = await file.text()
    const lines = fileContent.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo CSV debe tener al menos una fila de encabezados y una fila de datos'
        },
        { status: 400 }
      )
    }

    // Parsear CSV (manejo mejorado de CSV)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Comillas dobles escapadas
            current += '"'
            i++ // Saltar la siguiente comilla
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    // Obtener headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
    const requiredFields = ['username', 'email']

    // Validar headers
    const missingFields = requiredFields.filter(field => !headers.includes(field))
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Faltan campos requeridos: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    const result: ImportResult = {
      success: 0,
      errors: [],
      total: lines.length - 1
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId
    const createdBy = auth.userId

    // Pre-cargar config de jerarquía para auto-asignación
    let autoAssignEnabled = false
    let defaultTeamId: string | null = null

    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('hierarchy_enabled, hierarchy_config')
        .eq('id', organizationId)
        .single()

      const config = org?.hierarchy_config as Record<string, unknown> | null
      if (org?.hierarchy_enabled && config?.auto_assign_new_users) {
        autoAssignEnabled = true
        const { data: defaultTeam } = await supabase
          .from('organization_nodes')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('type', 'team')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        defaultTeamId = defaultTeam?.id || null
      }
    } catch (configError) {
      console.warn('⚠️ [import] Could not load hierarchy config:', configError)
    }

    // Procesar cada fila (empezando desde la línea 2, ya que la 1 es el header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const values = parseCSVLine(line)

        // Crear objeto con los valores
        const userData: any = {}
        headers.forEach((header, index) => {
          userData[header] = values[index]?.trim() || ''
        })

        // Validar campos requeridos
        if (!userData.username || !userData.email || !userData.password || !userData.password.trim()) {
          result.errors.push({
            row: i + 1,
            error: 'Faltan campos requeridos (username, email o password)',
            data: userData
          })
          continue
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(userData.email)) {
          result.errors.push({
            row: i + 1,
            error: 'Email inválido',
            data: userData
          })
          continue
        }

        // Validar rol
        const validRoles = ['owner', 'admin', 'member']
        const orgRole = (userData.org_role || 'member').toLowerCase()
        if (!validRoles.includes(orgRole)) {
          result.errors.push({
            row: i + 1,
            error: `Rol inválido. Debe ser: ${validRoles.join(', ')}`,
            data: userData
          })
          continue
        }

        // Verificar si el usuario ya existe
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email, username')
          .or(`email.eq.${userData.email},username.eq.${userData.username}`)
          .maybeSingle()

        if (existingUser) {
          result.errors.push({
            row: i + 1,
            error: `Usuario ya existe: ${existingUser.email === userData.email ? 'email' : 'username'}`,
            data: userData
          })
          continue
        }

        // Validar contraseña
        const password = userData.password.trim()

        if (password === '****************') {
          result.errors.push({
            row: i + 1,
            error: 'La contraseña es un placeholder. Por favor ingrese una contraseña real.',
            data: userData
          })
          continue
        }

        if (password.length < 6) {
          result.errors.push({
            row: i + 1,
            error: 'La contraseña debe tener al menos 6 caracteres',
            data: userData
          })
          continue
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const userInsertData: any = {
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          display_name: userData.display_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
          cargo_rol: 'Business User',
          type_rol: 'Business User',
          organization_id: organizationId,
          password_hash: passwordHash
        }

        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert(userInsertData)
          .select()
          .single()

        if (userError) {
          result.errors.push({
            row: i + 1,
            error: userError.message || 'Error al crear usuario',
            data: userData
          })
          continue
        }

        // Agregar a organization_users
        const { error: orgUserError } = await supabase
          .from('organization_users')
          .insert({
            organization_id: organizationId,
            user_id: newUser.id,
            role: orgRole as 'owner' | 'admin' | 'member',
            status: 'active',
            invited_by: createdBy,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString()
          })

        if (orgUserError) {
          // Si falla la inserción en organization_users, intentar eliminar el usuario creado
          await supabase.from('users').delete().eq('id', newUser.id)

          result.errors.push({
            row: i + 1,
            error: orgUserError.message || 'Error al agregar usuario a la organización',
            data: userData
          })
          continue
        }

        // Auto-asignar al equipo predeterminado si corresponde
        if (autoAssignEnabled && defaultTeamId && orgRole === 'member') {
          try {
            await supabase
              .from('organization_node_users')
              .insert({
                node_id: defaultTeamId,
                user_id: newUser.id,
                role: 'member',
                is_primary: true
              })
          } catch (autoAssignError) {
            console.warn(`⚠️ [import] Auto-assign failed for user ${newUser.id}:`, autoAssignError)
          }
        }

        result.success++
      } catch (error) {
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Error desconocido',
          data: {}
        })
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        imported: result.success,
        errors: result.errors.length,
        total: result.total,
        details: result.errors
      }
    })
  } catch (error) {
    logger.error('Error in /api/business/users/import:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al importar usuarios'
      },
      { status: 500 }
    )
  }
}
