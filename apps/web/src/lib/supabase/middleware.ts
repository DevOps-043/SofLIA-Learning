import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Refresca la sesion de Supabase (rotando cookies si el token expiro) y, de paso,
 * DEVUELVE el usuario nativo ya validado. Antes el middleware llamaba a
 * `auth.getUser()` aqui y de nuevo en la validacion de rol y en el chequeo de
 * suspension: 3 round trips de red a Supabase Auth por navegacion. Exponer el
 * usuario permite resolverlo UNA sola vez y reutilizarlo, recortando latencia y
 * carga sobre el Auth server (critico a 700-1000 usuarios concurrentes).
 */
export async function updateSession(
  request: NextRequest,
  forwardedRequestHeaders: Headers = new Headers(request.headers),
): Promise<{ response: NextResponse; user: User | null }> {
  let response = NextResponse.next({
    request: {
      headers: forwardedRequestHeaders,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: forwardedRequestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
