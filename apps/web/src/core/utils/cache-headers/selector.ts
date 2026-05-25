import {
  dynamicCache,
  immutableCache,
  privateCache,
  realtimeCache,
  semiStaticCache,
  staticCache,
} from './strategies'
import type { CacheContentType, CacheStrategy } from './strategies'

export function getCacheStrategy(contentType: CacheContentType): CacheStrategy {
  switch (contentType) {
    case 'static':
      return staticCache
    case 'semi-static':
      return semiStaticCache
    case 'dynamic':
      return dynamicCache
    case 'realtime':
      return realtimeCache
    case 'immutable':
      return immutableCache
    case 'private':
    default:
      return privateCache
  }
}
