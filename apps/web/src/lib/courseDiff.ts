/**
 * courseDiff.ts
 *
 * Compares the currently published course structure (original)
 * against the proposed payload (proposed) and produces a tree
 * annotated with diff statuses: added | removed | modified | unchanged.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged'

export interface FieldChange {
    field: string
    oldValue: any
    newValue: any
}

export interface DiffLesson {
    status: DiffStatus
    lesson_title: string
    original_title?: string
    changes: FieldChange[]
    /** Full proposed lesson data (for rendering) */
    proposed?: any
    /** Full original lesson data (for rendering) */
    original?: any
}

export interface DiffModule {
    status: DiffStatus
    module_title: string
    original_title?: string
    changes: FieldChange[]
    lessons: DiffLesson[]
}

export interface CourseDiff {
    courseChanges: FieldChange[]
    modules: DiffModule[]
    summary: {
        modulesAdded: number
        modulesRemoved: number
        modulesModified: number
        lessonsAdded: number
        lessonsRemoved: number
        lessonsModified: number
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeValue(val: any): any {
    if (val === undefined || val === null) return null
    if (typeof val === 'string') {
        const trimmed = val.trim()
        return trimmed === '' ? null : trimmed
    }
    return val
}

function compareFields(
    original: Record<string, any>,
    proposed: Record<string, any>,
    fields: string[]
): FieldChange[] {
    const changes: FieldChange[] = []
    for (const field of fields) {
        const oldVal = normalizeValue(original[field])
        const newVal = normalizeValue(proposed[field])
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({ field, oldValue: oldVal, newValue: newVal })
        }
    }
    return changes
}

// ─── Main diff function ──────────────────────────────────────────────────────

export function buildCourseDiff(
    originalCourse: any,
    proposedPreview: any
): CourseDiff {
    // ── Course-level changes ─────────────────────────────────────────────
    const courseFields = ['title', 'description', 'level', 'category', 'thumbnail_url']
    const courseChanges = compareFields(
        originalCourse,
        proposedPreview,
        courseFields
    )

    // ── Module & Lesson diff ─────────────────────────────────────────────
    const originalModules: any[] = originalCourse.modules ?? []
    const proposedModules: any[] = proposedPreview.modules ?? []

    // Match modules by order_index (the canonical key from CourseEngine)
    const originalByOrder = new Map<number, any>()
    for (const m of originalModules) {
        originalByOrder.set(m.module_order_index, m)
    }

    const proposedByOrder = new Map<number, any>()
    for (const m of proposedModules) {
        proposedByOrder.set(m.module_order_index, m)
    }

    const allOrderIndices = new Set<number>([
        ...originalByOrder.keys(),
        ...proposedByOrder.keys()
    ])

    let modulesAdded = 0, modulesRemoved = 0, modulesModified = 0
    let lessonsAdded = 0, lessonsRemoved = 0, lessonsModified = 0

    const diffModules: DiffModule[] = []

    for (const orderIdx of [...allOrderIndices].sort((a, b) => a - b)) {
        const orig = originalByOrder.get(orderIdx)
        const prop = proposedByOrder.get(orderIdx)

        if (!orig && prop) {
            // Entire module is NEW
            modulesAdded++
            const newLessons = (prop.lessons ?? []).map((l: any) => ({
                status: 'added' as DiffStatus,
                lesson_title: l.lesson_title,
                changes: [],
                proposed: l,
            }))
            lessonsAdded += newLessons.length
            diffModules.push({
                status: 'added',
                module_title: prop.module_title,
                changes: [],
                lessons: newLessons,
            })
        } else if (orig && !prop) {
            // Entire module was REMOVED
            modulesRemoved++
            const removedLessons = (orig.lessons ?? []).map((l: any) => ({
                status: 'removed' as DiffStatus,
                lesson_title: l.lesson_title,
                changes: [],
                original: l,
            }))
            lessonsRemoved += removedLessons.length
            diffModules.push({
                status: 'removed',
                module_title: orig.module_title,
                changes: [],
                lessons: removedLessons,
            })
        } else if (orig && prop) {
            // Module exists in both → compare
            const modChanges = compareFields(orig, prop, ['module_title'])

            // Lessons diff within this module
            const origLessons: any[] = orig.lessons ?? []
            const propLessons: any[] = prop.lessons ?? []
            const origLessonByOrder = new Map<number, any>()
            for (const l of origLessons) origLessonByOrder.set(l.lesson_order_index, l)
            const propLessonByOrder = new Map<number, any>()
            for (const l of propLessons) propLessonByOrder.set(l.lesson_order_index, l)

            const allLessonOrders = new Set<number>([
                ...origLessonByOrder.keys(),
                ...propLessonByOrder.keys()
            ])

            const diffLessons: DiffLesson[] = []
            for (const lessonOrder of [...allLessonOrders].sort((a, b) => a - b)) {
                const oLesson = origLessonByOrder.get(lessonOrder)
                const pLesson = propLessonByOrder.get(lessonOrder)

                if (!oLesson && pLesson) {
                    lessonsAdded++
                    diffLessons.push({
                        status: 'added',
                        lesson_title: pLesson.lesson_title,
                        changes: [],
                        proposed: pLesson,
                    })
                } else if (oLesson && !pLesson) {
                    lessonsRemoved++
                    diffLessons.push({
                        status: 'removed',
                        lesson_title: oLesson.lesson_title,
                        changes: [],
                        original: oLesson,
                    })
                } else if (oLesson && pLesson) {
                    const lessonChanges = compareFields(oLesson, pLesson, [
                        'lesson_title',
                        'video_provider_id',
                        'duration_seconds',
                        'transcript_content',
                        'summary_content',
                    ])
                    if (lessonChanges.length > 0) {
                        lessonsModified++
                        diffLessons.push({
                            status: 'modified',
                            lesson_title: pLesson.lesson_title,
                            original_title: oLesson.lesson_title !== pLesson.lesson_title ? oLesson.lesson_title : undefined,
                            changes: lessonChanges,
                            proposed: pLesson,
                            original: oLesson,
                        })
                    } else {
                        diffLessons.push({
                            status: 'unchanged',
                            lesson_title: pLesson.lesson_title,
                            changes: [],
                            proposed: pLesson,
                            original: oLesson,
                        })
                    }
                }
            }

            const moduleHasChanges = modChanges.length > 0 || diffLessons.some(l => l.status !== 'unchanged')
            if (moduleHasChanges) modulesModified++

            diffModules.push({
                status: moduleHasChanges ? 'modified' : 'unchanged',
                module_title: prop.module_title,
                original_title: modChanges.some(c => c.field === 'module_title') ? orig.module_title : undefined,
                changes: modChanges,
                lessons: diffLessons,
            })
        }
    }

    return {
        courseChanges,
        modules: diffModules,
        summary: {
            modulesAdded,
            modulesRemoved,
            modulesModified,
            lessonsAdded,
            lessonsRemoved,
            lessonsModified,
        }
    }
}
