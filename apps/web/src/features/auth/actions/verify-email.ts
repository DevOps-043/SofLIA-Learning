'use server'

import { z } from 'zod'

import { verifyEmailConfirmation } from '../services/email-verification.service'

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

    const result = await verifyEmailConfirmation({
      tokenHash: token,
      type: 'email',
    })

    return {
      success: true,
      message: 'Email verificado correctamente',
      userId: result.userId,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Error inesperado' }
  }
}
