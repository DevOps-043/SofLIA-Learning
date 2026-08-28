'use server'

import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import { z } from 'zod'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
})

export async function verifyEmailAction(formData: FormData | { token: string }) {
  try {
    let token: string

    if (formData instanceof FormData) {
      const parsed = verifyEmailSchema.parse({
        token: formData.get('token'),
      })
      token = parsed.token
    } else {
      const parsed = verifyEmailSchema.parse(formData)
      token = parsed.token
    }

    const supabase = await createClient()
    
    // Verificar con Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    })
    
    if (error) {
      return { error: 'Código de verificación inválido o expirado' }
    }
    
    if (!data.user?.id || !data.user.email_confirmed_at) {
      return { error: 'No se pudo obtener información del usuario' }
    }

    // Actualizar email_verified en users
    const { error: updateError } = await createAdminClient()
      .from('users')
      .update({
        email_verified: true,
        email_verified_at: data.user.email_confirmed_at,
      })
      .eq('id', data.user.id)
    
    if (updateError) {
      return { error: 'Error al actualizar verificación de email' }
    }
    
    return { 
      success: true, 
      message: 'Email verificado correctamente',
      user: data.user 
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Error inesperado' }
  }
}
