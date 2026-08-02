/**
 * Notebook Enrichment — Pure normalization logic
 *
 * Prompt building, content hashing and normalization of the (untrusted) model
 * output. No I/O and no framework imports, so it is separately unit-tested —
 * same pattern as notebook-tree.builder.ts.
 */

import { createHash } from 'crypto'
import { z } from 'zod'

import type { NotebookKnowledgeType } from '../types'

export const MAX_SUGGESTED_TASKS = 5
export const MAX_KEY_CONCEPTS = 8
export const MAX_SUGGESTED_TAGS = 5
export const MAX_SUMMARY_LENGTH = 1_500

export const KNOWLEDGE_TYPES: readonly NotebookKnowledgeType[] = [
  'note',
  'reflection',
  'decision',
  'qa',
  'resource',
  'evidence',
]

/**
 * Loose schema on purpose: the model output is untrusted, so every field is
 * optional here and normalized afterwards instead of failing the whole job on
 * a single malformed field.
 */
const aiEnrichmentOutputSchema = z.object({
  confidence: z.number().optional(),
  detected_tasks: z.array(z.object({ title: z.string() })).optional(),
  key_concepts: z.array(z.string()).optional(),
  knowledge_type: z.string().optional(),
  suggested_tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
})

export const structuredAiEnrichmentOutputSchema = z.object({
  confidence: z.number().min(0).max(1),
  detected_tasks: z.array(z.object({ title: z.string().min(1).max(200) })).max(5),
  key_concepts: z.array(z.string().min(1).max(80)).max(8),
  knowledge_type: z.enum([
    'note',
    'reflection',
    'decision',
    'qa',
    'resource',
    'evidence',
  ]),
  suggested_tags: z.array(z.string().min(1).max(40)).max(5),
  summary: z.string().max(MAX_SUMMARY_LENGTH),
})

export const AI_ENRICHMENT_JSON_SCHEMA: Record<string, unknown> = {
  additionalProperties: false,
  properties: {
    confidence: { maximum: 1, minimum: 0, type: 'number' },
    detected_tasks: {
      items: {
        additionalProperties: false,
        properties: { title: { type: 'string' } },
        required: ['title'],
        type: 'object',
      },
      maxItems: 5,
      type: 'array',
    },
    key_concepts: { items: { type: 'string' }, maxItems: 8, type: 'array' },
    knowledge_type: {
      enum: ['note', 'reflection', 'decision', 'qa', 'resource', 'evidence'],
      type: 'string',
    },
    suggested_tags: { items: { type: 'string' }, maxItems: 5, type: 'array' },
    summary: { type: 'string' },
  },
  required: [
    'confidence',
    'detected_tasks',
    'key_concepts',
    'knowledge_type',
    'suggested_tags',
    'summary',
  ],
  type: 'object',
}

export interface NormalizedEnrichment {
  confidence: number | null
  detectedTasks: string[]
  keyConcepts: string[]
  knowledgeType: NotebookKnowledgeType
  suggestedTags: string[]
  summary: string | null
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function clip(value: string, maxLength: number): string {
  const trimmed = value.trim()
  return trimmed.length <= maxLength
    ? trimmed
    : `${trimmed.slice(0, maxLength).trim()}...`
}

/**
 * Stable content hash used for job idempotency: the same title+content never
 * enqueues (nor pays for) a second enrichment.
 */
export function computeNoteContentHash(title: string, contentHtml: string): string {
  return createHash('sha256')
    .update(title.trim())
    .update(' ')
    .update(contentHtml.trim())
    .digest('hex')
}

function normalizeStringList(
  values: string[] | undefined,
  maxItems: number,
  maxLength: number,
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values ?? []) {
    const value = clip(raw, maxLength)
    const key = value.toLowerCase()
    if (!value || seen.has(key)) continue
    seen.add(key)
    result.push(value)
    if (result.length >= maxItems) break
  }
  return result
}

/** Normalizes untrusted model output into safe, bounded enrichment values. */
export function normalizeAiOutput(raw: unknown): NormalizedEnrichment {
  const parsed = aiEnrichmentOutputSchema.safeParse(raw)
  const output = parsed.success ? parsed.data : {}

  const knowledgeType = KNOWLEDGE_TYPES.includes(
    output.knowledge_type as NotebookKnowledgeType,
  )
    ? (output.knowledge_type as NotebookKnowledgeType)
    : 'note'

  const confidence =
    typeof output.confidence === 'number' && Number.isFinite(output.confidence)
      ? Math.min(1, Math.max(0, Math.round(output.confidence * 100) / 100))
      : null

  return {
    confidence,
    detectedTasks: normalizeStringList(
      (output.detected_tasks ?? []).map((task) => task.title),
      MAX_SUGGESTED_TASKS,
      200,
    ),
    keyConcepts: normalizeStringList(output.key_concepts, MAX_KEY_CONCEPTS, 80),
    knowledgeType,
    suggestedTags: normalizeStringList(output.suggested_tags, MAX_SUGGESTED_TAGS, 40),
    summary: output.summary ? clip(output.summary, MAX_SUMMARY_LENGTH) : null,
  }
}
