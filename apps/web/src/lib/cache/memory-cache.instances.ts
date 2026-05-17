import { MemoryCache } from './memory-cache.class'

export const courseValidationCache = new MemoryCache<{
  courseId: string
  slug: string
}>(1, 5 * 60 * 1000)

export const userDataCache = new MemoryCache<unknown>(
  0.5,
  1 * 60 * 1000,
)

export const courseDataCache = new MemoryCache<unknown>(
  5,
  10 * 60 * 1000,
)

export const queryCache = new MemoryCache<unknown>(
  3,
  5 * 60 * 1000,
)

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    courseValidationCache.cleanup()
    userDataCache.cleanup()
    courseDataCache.cleanup()
    queryCache.cleanup()
  }, 10 * 60 * 1000)
}
