import type { LearningPath, LearningPathItem } from '../../types'
import type { LearningPathItemRow, LearningPathRow } from './learning-path-row.types'

export function mapLearningPathItems(rows: LearningPathItemRow[]): LearningPathItem[] {
  return rows
    .sort((left, right) => left.position - right.position)
    .map((row) => ({
      id: row.id,
      learning_path_id: row.learning_path_id,
      course_id: row.course_id,
      position: row.position,
      course: row.courses
        ? {
            id: row.courses.id,
            title: row.courses.title || 'Curso sin titulo',
            slug: row.courses.slug,
            thumbnail_url: row.courses.thumbnail_url,
            category: row.courses.category,
            level: row.courses.level,
          }
        : null,
    }))
}

export function mapLearningPaths(
  paths: LearningPathRow[],
  itemsByPathId: Map<string, LearningPathItem[]>,
): LearningPath[] {
  return paths.map((path) => {
    const items = itemsByPathId.get(path.id) || []

    return {
      id: path.id,
      title: path.title,
      slug: path.slug,
      description: path.description,
      is_active: Boolean(path.is_active),
      created_at: path.created_at,
      updated_at: path.updated_at,
      items,
      item_count: items.length,
    }
  })
}
