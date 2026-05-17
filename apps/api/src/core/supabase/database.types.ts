import type { PublicSchema } from './database/public-schema.types'

export type { Json } from './database/json.types'

export interface Database {
  public: PublicSchema
}
