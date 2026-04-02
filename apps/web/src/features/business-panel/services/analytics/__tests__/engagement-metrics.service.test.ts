import { describe, expect, it } from 'vitest'
import {
  calculateDuration,
  calculateFrequency,
  calculateHeatmap,
  calculateStickiness,
  calculateStreaks,
} from '../engagement-metrics.service'

describe('engagement-metrics.service', () => {
  it('calculates stickiness points from active weeks', () => {
    const result = calculateStickiness([
      {
        user_id: 'user-1',
        progress_date: '2026-03-02',
        had_activity: true,
        streak_count: 2,
        study_minutes: 30,
      },
      {
        user_id: 'user-2',
        progress_date: '2026-03-03',
        had_activity: true,
        streak_count: 1,
        study_minutes: 20,
      },
      {
        user_id: 'user-1',
        progress_date: '2026-03-10',
        had_activity: true,
        streak_count: 3,
        study_minutes: 40,
      },
    ])

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ dau: 2, mau: 2, ratio: 100 })
    expect(result[1]).toMatchObject({ dau: 1, mau: 2, ratio: 50 })
    expect(typeof result[0].name).toBe('string')
  })

  it('groups active users by 30-day frequency buckets', () => {
    const result = calculateFrequency(
      [
        { user_id: 'user-1', progress_date: '2026-03-29', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-1', progress_date: '2026-03-28', had_activity: true, streak_count: 0, study_minutes: 20 },
        { user_id: 'user-2', progress_date: '2026-03-27', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-2', progress_date: '2026-03-26', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-2', progress_date: '2026-03-25', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-2', progress_date: '2026-03-24', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-2', progress_date: '2026-03-23', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-2', progress_date: '2026-03-22', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-3', progress_date: '2026-02-01', had_activity: true, streak_count: 0, study_minutes: 10 },
      ],
      '2026-03-01',
    )

    expect(result).toEqual([
      { name: '1-2 días', users: 1 },
      { name: '6-10 días', users: 1 },
    ])
  })

  it('builds streak distribution from most recent streak values', () => {
    const result = calculateStreaks(
      [
        { user_id: 'user-1', progress_date: '2026-03-31', had_activity: true, streak_count: 0, study_minutes: 10 },
        { user_id: 'user-2', progress_date: '2026-03-31', had_activity: true, streak_count: 3, study_minutes: 20 },
        { user_id: 'user-3', progress_date: '2026-03-31', had_activity: true, streak_count: 8, study_minutes: 30 },
      ],
      ['user-1', 'user-2', 'user-3'],
    )

    expect(result).toEqual([
      { name: 'Sin racha', value: 33, fill: '#EF4444' },
      { name: '1-3 días', value: 33, fill: '#F59E0B' },
      { name: '4-7 días', value: 0, fill: '#3B82F6' },
      { name: '7+ días', value: 33, fill: '#10B981' },
    ])
  })

  it('maps sessions into day/hour heatmap buckets', () => {
    const result = calculateHeatmap([
      { user_id: 'user-1', start_time: '2026-03-30T08:00:00', actual_duration_minutes: 45 },
      { user_id: 'user-1', start_time: '2026-03-30T08:30:00', actual_duration_minutes: 30 },
      { user_id: 'user-2', start_time: '2026-03-31T19:00:00', actual_duration_minutes: 50 },
    ])

    expect(result).toEqual(
      expect.arrayContaining([
        { day: 'Lun', hour: '6-9', value: 2 },
        { day: 'Mar', hour: '18-21', value: 1 },
      ]),
    )
  })

  it('calculates median and max duration by role', () => {
    const result = calculateDuration(
      [
        { user_id: 'user-1', start_time: '2026-03-30T08:00:00.000Z', actual_duration_minutes: 20 },
        { user_id: 'user-1', start_time: '2026-03-30T10:00:00.000Z', actual_duration_minutes: 40 },
        { user_id: 'user-2', start_time: '2026-03-30T12:00:00.000Z', actual_duration_minutes: 15 },
      ],
      [
        { user_id: 'user-1', role: 'student', job_title: null },
        { user_id: 'user-2', role: 'admin', job_title: null },
      ],
    )

    expect(result).toEqual(
      expect.arrayContaining([
        { role: 'student', median: 40, max: 40, count: 2 },
        { role: 'admin', median: 15, max: 15, count: 1 },
      ]),
    )
  })
})
