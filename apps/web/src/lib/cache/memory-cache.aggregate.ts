import {
  courseDataCache,
  courseValidationCache,
  queryCache,
  userDataCache,
} from './memory-cache.instances'

export function getAllCacheStats() {
  const courseValidation = courseValidationCache.getStats()
  const userData = userDataCache.getStats()
  const courseData = courseDataCache.getStats()
  const query = queryCache.getStats()

  return {
    courseValidation,
    userData,
    courseData,
    query,
    total: {
      currentSize:
        courseValidation.currentSize +
        userData.currentSize +
        courseData.currentSize +
        query.currentSize,
      maxSize: 10 * 1024 * 1024,
      entries:
        courseValidation.entryCount +
        userData.entryCount +
        courseData.entryCount +
        query.entryCount,
    },
  }
}
