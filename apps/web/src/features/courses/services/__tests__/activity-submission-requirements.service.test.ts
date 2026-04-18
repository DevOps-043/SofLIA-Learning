import { describe, expect, it } from 'vitest'

import {
  getActivitySubmissionRequirementIssues,
  isActivitySubmissionStructurallyComplete,
} from '../activity-submission-requirements.service'
import type { ActivityConfig } from '../../types/activity-config'

describe('activity-submission-requirements.service', () => {
  it('requires long text reflections to include the main response', () => {
    const config: ActivityConfig = {
      interactionType: 'long_text',
      submission: {
        requireEvidence: false,
      },
      validation: {
        enabled: false,
        requiredForCompletion: false,
        rubric: [],
      },
    }

    const issues = getActivitySubmissionRequirementIssues(config, {
      responsePayload: {},
      responseText: '',
    })

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'response_required',
      }),
    ])
    expect(isActivitySubmissionStructurallyComplete(config, {
      responsePayload: {},
      responseText: '',
    })).toBe(false)
  })

  it('requires configured evidence for reflections before submission', () => {
    const config: ActivityConfig = {
      interactionType: 'long_text',
      submission: {
        requireEvidence: true,
      },
      validation: {
        enabled: false,
        requiredForCompletion: false,
        rubric: [],
      },
    }

    const issues = getActivitySubmissionRequirementIssues(config, {
      responsePayload: {
        text: 'Mi reflexion final',
      },
      responseText: 'Mi reflexion final',
      evidencePayload: null,
    })

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'evidence_required',
      }),
    ])
  })

  it('requires all mandatory checklist items before submission', () => {
    const config: ActivityConfig = {
      interactionType: 'checklist',
      submission: {
        checklistItems: [
          { id: 'step_1', label: 'Analizar el caso', required: true },
          { id: 'step_2', label: 'Documentar hallazgos', required: true },
        ],
        requireEvidence: false,
      },
      validation: {
        enabled: false,
        requiredForCompletion: false,
        rubric: [],
      },
    }

    const issues = getActivitySubmissionRequirementIssues(config, {
      responsePayload: {
        checklist: {
          step_1: true,
          step_2: false,
        },
      },
      responseText: 'Avance parcial',
    })

    expect(issues).toEqual([
      expect.objectContaining({
        code: 'required_checklist_items_missing',
      }),
    ])
  })

  it('accepts inline reflections when all configured fields are completed', () => {
    const config: ActivityConfig = {
      interactionType: 'inline_answers',
      submission: {
        fields: [
          { id: 'field_1', label: 'Hallazgo principal', required: true, multiline: false },
          { id: 'field_2', label: 'Proximo paso', required: true, multiline: true },
        ],
        requireEvidence: false,
      },
      validation: {
        enabled: false,
        requiredForCompletion: false,
        rubric: [],
      },
    }

    expect(isActivitySubmissionStructurallyComplete(config, {
      responsePayload: {
        answers: {
          field_1: 'Detecte el sesgo',
          field_2: 'Voy a contrastar con otra fuente',
        },
      },
      responseText: '',
    })).toBe(true)
  })
})
