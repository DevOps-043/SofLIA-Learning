import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  isCourseManagementTabDisabled,
} from '../CourseManagement.utils'

describe('CourseManagement.utils', () => {
  describe('formatDuration', () => {
    it('returns zero minutes for empty or invalid values', () => {
      expect(formatDuration(0)).toBe('0 min')
      expect(formatDuration(-5)).toBe('0 min')
    })

    it('formats minutes under one hour', () => {
      expect(formatDuration(45)).toBe('45 min')
    })

    it('formats exact hours', () => {
      expect(formatDuration(120)).toBe('2h')
    })

    it('formats mixed hours and minutes', () => {
      expect(formatDuration(125)).toBe('2h 5min')
    })
  })

  describe('isCourseManagementTabDisabled', () => {
    it('only keeps config enabled for new courses', () => {
      expect(isCourseManagementTabDisabled('config', true)).toBe(false)
      expect(isCourseManagementTabDisabled('modules', true)).toBe(true)
      expect(isCourseManagementTabDisabled('preview', true)).toBe(true)
      expect(isCourseManagementTabDisabled('stats', true)).toBe(true)
    })

    it('keeps every tab enabled for persisted courses', () => {
      expect(isCourseManagementTabDisabled('config', false)).toBe(false)
      expect(isCourseManagementTabDisabled('modules', false)).toBe(false)
      expect(isCourseManagementTabDisabled('preview', false)).toBe(false)
      expect(isCourseManagementTabDisabled('stats', false)).toBe(false)
    })
  })
})
