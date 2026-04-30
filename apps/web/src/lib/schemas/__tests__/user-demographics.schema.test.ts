import { describe, expect, it } from 'vitest'
import {
  RegisterDemographicsSchema,
  UserDemographicsSchema,
  calculateAgeFromDateOfBirth,
  normalizeDateOfBirthForStorage,
  normalizeGenderForStorage,
} from '../user-demographics.schema'

describe('user-demographics.schema', () => {
  it('accepts valid optional demographics', () => {
    expect(
      UserDemographicsSchema.parse({
        date_of_birth: '1990-05-10',
        gender: 'non_binary',
      }),
    ).toEqual({
      date_of_birth: '1990-05-10',
      gender: 'non_binary',
    })
  })

  it('normalizes empty register values as optional nulls', () => {
    expect(
      RegisterDemographicsSchema.parse({
        dateOfBirth: '',
        gender: '',
      }),
    ).toEqual({
      dateOfBirth: null,
      gender: null,
    })
    expect(normalizeDateOfBirthForStorage('')).toBeNull()
    expect(normalizeGenderForStorage('')).toBeNull()
  })

  it('rejects invalid gender and out-of-range dates', () => {
    expect(() =>
      UserDemographicsSchema.parse({ gender: 'invalid' }),
    ).toThrow()
    expect(() =>
      UserDemographicsSchema.parse({ date_of_birth: '1899-12-31' }),
    ).toThrow()
    expect(() =>
      UserDemographicsSchema.parse({ date_of_birth: '2999-01-01' }),
    ).toThrow()
  })

  it('calculates age without storing derived data', () => {
    expect(
      calculateAgeFromDateOfBirth(
        '2000-04-25',
        new Date('2026-04-25T12:00:00.000Z'),
      ),
    ).toBe(26)
    expect(
      calculateAgeFromDateOfBirth(
        '2000-04-26',
        new Date('2026-04-25T12:00:00.000Z'),
      ),
    ).toBe(25)
  })
})
