import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const publicRouteFiles = [
  'src/app/api/categories/route.ts',
  'src/app/api/courses/route.ts',
  'src/app/api/courses/[slug]/learn-data/route.ts',
  'src/app/api/courses/[slug]/modules/route.ts',
  'src/app/api/workshops/[id]/metadata/route.ts',
  'src/app/api/certificates/verify/[hash]/route.ts',
]

describe('public API error privacy', () => {
  it.each(publicRouteFiles)('%s does not serialize internal exception messages', (file) => {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

    expect(source).not.toMatch(/details\s*:\s*error(?:\s+instanceof|\.)/)
    expect(source).not.toMatch(/message\s*:\s*errorMessage/)
    expect(source).not.toMatch(/error\s*:\s*error\.message/)
  })
})
