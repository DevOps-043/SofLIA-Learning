/**
 * ⚡ MIDDLEWARE DE VALIDACIÓN DE CURSOS
 *
 * Propósito: Validar cursos UNA SOLA VEZ en el Edge antes de llegar a los endpoints
 * Esto evita que cada endpoint valide el curso por separado
 *
 * Beneficios:
 * - Validación en Edge (ultra rápido)
 * - Caché de validaciones con TTL
 * - Reduce queries duplicadas
 * - Puede agregar el courseId al header para que endpoints lo usen directamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cache en memoria para validaciones de curso (Edge compatible)
const courseValidationCache = new Map<string, {
  courseId: string
  timestamp: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

/**
 * Valida que un curso existe por su slug
 * Usa caché en memoria para evitar queries repetidas
 */
export async function validateCourseSlug(
  slug: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ valid: boolean; courseId?: string; error?: string }> {
  // Verificar caché primero
  const cached = courseValidationCache.get(slug)
  const now = Date.now()

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return { valid: true, courseId: cached.courseId }
  }

  try {
    // Crear cliente de Supabase (Edge compatible)
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: course, error } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error || !course) {
      return { valid: false, error: 'Curso no encontrado' }
    }

    // Guardar en caché
    courseValidationCache.set(slug, {
      courseId: course.id,
      timestamp: now
    })

    // Limpiar caché si crece mucho (máximo 1000 cursos)
    if (courseValidationCache.size > 1000) {
      const oldestEntry = Array.from(courseValidationCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      courseValidationCache.delete(oldestEntry[0])
    }

    return { valid: true, courseId: course.id }
  } catch (error) {
    return { valid: false, error: 'Error al validar curso' }
  }
}

/**
 * Middleware para rutas de cursos
 * Agrega el courseId al header X-Course-Id para que endpoints lo usen
 */
export async function courseValidationMiddleware(request: NextRequest) {
  const url = new URL(request.url)

  // Extraer slug de la URL
  const pathMatch = url.pathname.match(/\/api\/courses\/([^\/]+)/)
  if (!pathMatch) {
    return NextResponse.next()
  }

  const slug = pathMatch[1]

  // Validar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Configuración de Supabase faltante' },
      { status: 500 }
    )
  }

  // Validar curso
  const validation = await validateCourseSlug(slug, supabaseUrl, supabaseKey)

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || 'Curso no encontrado' },
      { status: 404 }
    )
  }

  // Agregar courseId al header para que endpoints lo usen
  const response = NextResponse.next()
  response.headers.set('X-Course-Id', validation.courseId!)
  response.headers.set('X-Course-Slug', slug)

  return response
}

/**
 * Obtener estadísticas del caché de validación
 */
export function getCourseValidationStats() {
  return {
    cachedCourses: courseValidationCache.size,
    maxSize: 1000
  }
}
