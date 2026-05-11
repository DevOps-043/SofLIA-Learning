import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '../../../lib/logger'
import { ProfileServerService } from '../../../features/profile/services/profile-server.service'
import { SessionService } from '../../../features/auth/services/session.service'
import {
  DateOfBirthSchema,
  UserGenderSchema,
} from '../../../lib/schemas/user-demographics.schema'

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  display_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  cargo_rol: z.string().optional().nullable(),
  type_rol: z.string().optional().nullable(),
  job_title: z.string().max(100).optional().nullable(),
  job_description: z.string().max(1000).optional().nullable(),
  profile_picture_url: z.union([z.string().url().max(500), z.literal('')]).optional().nullable(),
  country_code: z.string().max(10).optional().nullable(),
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
}).strict()

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org') || null

    const profile = await ProfileServerService.getProfile(user.id, organizationId)
    return NextResponse.json(profile)
  } catch (error) {
    logger.error('Error in profile GET API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org') || null

    const rawBody = await request.json()
    const parsed = UpdateProfileSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de perfil inválidos', details: parsed.error.format() },
        { status: 400 }
      )
    }
    const updatedProfile = await ProfileServerService.updateProfile(user.id, parsed.data, organizationId)

    return NextResponse.json(updatedProfile)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    logger.error('Error in profile PUT API:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
