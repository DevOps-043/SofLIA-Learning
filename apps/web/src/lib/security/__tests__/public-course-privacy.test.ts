import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function readSource(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

describe('public course API privacy', () => {
  it('derives personalization exclusively from the authenticated session', () => {
    for (const sourcePath of [
      'src/app/api/courses/route.ts',
      'src/app/api/courses/[slug]/route.ts',
      'src/app/api/courses/[slug]/full/full/full-request.ts',
    ]) {
      const source = readSource(sourcePath)
      expect(source).not.toMatch(/searchParams\.get\(['"]userId['"]\)/)
    }
  })

  it('uses an explicit non-sensitive instructor projection', () => {
    const fullCourseQueries = readSource(
      'src/app/api/courses/[slug]/full/full/full-course-queries.ts',
    )

    expect(fullCourseQueries).not.toMatch(/\.select\(`[^`]*(email|platform_role|phone|date_of_birth)[^`]*`\)/s)
    expect(fullCourseQueries).toContain('profile_picture_url, bio')
  })

  it('requires active, approved courses in the shared public service', () => {
    const courseService = readSource(
      'src/features/courses/services/course.service.ts',
    )

    expect(courseService).toContain(".eq('approval_status', 'approved')")
    expect(courseService).not.toContain('instructor:users!instructor_id')
  })

  it('keeps the public modules response to published catalog metadata', () => {
    const modulesRoute = readSource(
      'src/app/api/courses/[slug]/modules/route.ts',
    )

    expect(modulesRoute).toContain(".eq('approval_status', 'approved')")
    expect(modulesRoute.match(/\.eq\('is_published', true\)/g)).toHaveLength(2)
    expect(modulesRoute).not.toMatch(/\bvideo_provider_id\b/)
    expect(modulesRoute).not.toMatch(/\btranscript_content\b/)
    expect(modulesRoute).not.toMatch(/\bsummary_content\b/)
    expect(modulesRoute).toContain('cacheHeaders.private')
    expect(modulesRoute).not.toContain('cacheHeaders.semiStatic')
  })
})
