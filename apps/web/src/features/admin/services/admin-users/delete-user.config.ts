export interface DeleteTableConfig {
  tableName: string
  column?: string
}

export {
  USER_NULL_UPDATE_TABLES,
  USER_REQUIRED_INSTRUCTOR_REFERENCE_TABLES,
} from './delete-user.reference-tables'
export { USER_SIMPLE_DELETE_TABLES } from './delete-user.simple-tables'
