export const JSON_LIKE_PATTERN = /^\s*[[{"].*$/s
export const MAX_PARSE_DEPTH = 3
export const MAX_RECURSION_DEPTH = 8
export const JSON_LIKE_FIELD_PATTERN =
  /"([A-Za-z_][\w]*)"\s*:\s*"([\s\S]*?)"\s*(?=,\s*"[A-Za-z_][\w]*"\s*:|\s*\}$)/g

export const PRIORITIZED_FIELD_KEYS = [
  'title',
  'subtitle',
  'heading',
  'introduction',
  'instructions',
  'text',
  'content',
  'body',
  'description',
  'prompt',
  'question',
  'message',
  'children',
  'closing',
  'reflectionQuestion',
  'reflection_prompt',
]

export const IGNORED_LEAF_KEYS = new Set([
  'id',
  'type',
  'order',
  'emotion',
  'character',
  'questionType',
  'question_type',
  'correctAnswer',
  'correct_answer',
  'points',
  'difficulty',
  'bloom_level',
  'passing_score',
  'totalPoints',
  'total_points',
  'is_required',
  'is_downloadable',
])
