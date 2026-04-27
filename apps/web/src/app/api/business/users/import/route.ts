import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { BusinessUsersServerService } from '@/features/business-panel/services/businessUsers.server.service'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import {
  UserDemographicsSchema,
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
  type UserGender,
} from '@/lib/schemas/user-demographics.schema'

interface ImportResult {
  success: number
  errors: Array<{ row: number; error: string; data: Record<string, unknown> }>
  total: number
}

type ParsedImportUserRow = Record<string, string>

interface UserInsertData {
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string
  type_rol: string
  organization_id: string
  password_hash: string
  date_of_birth: string | null
  gender: UserGender | null
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

    // Obtener headers y normalizar
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())

    // Mapeo de alias para job_title
    const jobTitleAliases = ['job_title', 'cargo', 'puesto', 'rol', 'role']
    const jobTitleHeaderIndex = headers.findIndex(h => jobTitleAliases.includes(h))
    const dateOfBirthAliases = ['date_of_birth', 'fecha_nacimiento', 'birth_date', 'dob']
    const dateOfBirthHeaderIndex = headers.findIndex(h => dateOfBirthAliases.includes(h))
    const genderAliases = ['gender', 'genero', 'género']
    const genderHeaderIndex = headers.findIndex(h => genderAliases.includes(h))

    // Si encontramos un alias, normalizamos el header para facilitar el acceso luego
    if (jobTitleHeaderIndex !== -1) {
      headers[jobTitleHeaderIndex] = 'job_title'
    }
    if (dateOfBirthHeaderIndex !== -1) {
      headers[dateOfBirthHeaderIndex] = 'date_of_birth'
    }
    if (genderHeaderIndex !== -1) {
      headers[genderHeaderIndex] = 'gender'
    }

    const requiredFields = ['username', 'email', 'job_title'] // Agregamos job_title como requerido

    // Validar headers
    const missingFields = requiredFields.filter(field => !headers.includes(field))

    if (missingFields.length > 0) {
      // Mensaje personalizado si falta job_title para explicar los alias permitidos
      if (missingFields.includes('job_title')) {
        return NextResponse.json(
          {
            success: false,
            error: `Falta la columna requerida: "job_title" (también se permiten: "cargo", "puesto", "rol")`
          },
          { status: 400 }
        )
      }

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
        const userData: ParsedImportUserRow = {}
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

        // Validar job_title
        if (!userData.job_title || !userData.job_title.trim()) {
          result.errors.push({
            row: i + 1,
            error: 'El campo "job_title" (o cargo/puesto) es obligatorio',
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

        const demographicsResult = UserDemographicsSchema.safeParse({
          date_of_birth: userData.date_of_birth,
          gender: userData.gender,
        })

        if (!demographicsResult.success) {
          result.errors.push({
            row: i + 1,
            error:
              demographicsResult.error.errors[0]?.message ||
              'Datos demograficos invalidos',
            data: userData
          })
          continue
        }

        // Verificar si el usuario ya existe y su estado en la organización
        const { data: existingUser } = await supabase
          .from('users')
          .select(`
            id, 
            email, 
            username
          `)
          .or(`email.eq.${userData.email},username.eq.${userData.username}`)
          .maybeSingle()

        if (existingUser) {
          // Verificar si ya está en la organización
          const { data: existingOrgUser } = await supabase
            .from('organization_users')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', existingUser.id)
            .maybeSingle()

          if (existingOrgUser) {
            result.errors.push({
              row: i + 1,
              error: `Este usuario ya es miembro de tu organización (Rol: ${existingOrgUser.role}).`,
              data: {
                ...userData,
                existing_role: existingOrgUser.role
              }
            })
          } else {
            result.errors.push({
              row: i + 1,
              error: `Este correo ya está registrado en la plataforma pero NO en tu organización. Por favor utiliza la opción "Invitar" para agregarlo a tu equipo.`,
              data: userData
            })
          }
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

        const userInsertData: UserInsertData = {
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          display_name: userData.display_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
          cargo_rol: 'Business User',
          type_rol: 'Business User',
          organization_id: organizationId,
          password_hash: passwordHash,
          date_of_birth: normalizeDateOfBirthForStorage(
            demographicsResult.data.date_of_birth,
          ),
          gender: normalizeGenderForStorage(demographicsResult.data.gender)
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
            job_title: userData.job_title.trim(), // Guardamos el job_title
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
