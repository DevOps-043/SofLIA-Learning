import { z } from 'zod'
import { DateOfBirthSchema } from './date-of-birth.schema'
import { UserGenderSchema } from './gender.schema'

export const UserDemographicsSchema = z.object({
  date_of_birth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
})

export const RegisterDemographicsSchema = z.object({
  dateOfBirth: DateOfBirthSchema.optional(),
  gender: UserGenderSchema.optional(),
})
