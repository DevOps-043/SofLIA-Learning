import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '../lib/supabase/types'

export function createProxySupabaseClient(
  request: NextRequest,
  updateResponse?: (response: NextResponse) => void,
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          if (!updateResponse) return
          const nextResponse = ResponseNext(request)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => nextResponse.cookies.set(name, value, options))
          updateResponse(nextResponse)
        },
      },
    },
  )
}

function ResponseNext(request: NextRequest) {
  return NextResponse.next({ request })
}
