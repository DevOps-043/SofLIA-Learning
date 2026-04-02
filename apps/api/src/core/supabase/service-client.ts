import { createClient } from '@supabase/supabase-js'

import { config } from '@/config/env'
import type { Database } from './database.types'

let serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient<Database>(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return serviceClient
}
