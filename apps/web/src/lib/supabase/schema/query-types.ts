import type { Database } from './database'

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]
type SchemaName = keyof DatabaseWithoutInternals
type TablesAndViews<Schema extends SchemaName> = DatabaseWithoutInternals[Schema]['Tables'] & DatabaseWithoutInternals[Schema]['Views']

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof TablesAndViews<'public'> | { schema: SchemaName },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: SchemaName }
    ? keyof TablesAndViews<DefaultSchemaTableNameOrOptions['schema']>
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: SchemaName }
  ? TablesAndViews<DefaultSchemaTableNameOrOptions['schema']>[TableName] extends { Row: infer Row }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof TablesAndViews<'public'>
    ? TablesAndViews<'public'>[DefaultSchemaTableNameOrOptions] extends { Row: infer Row }
      ? Row
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: SchemaName },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: SchemaName }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: SchemaName }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Insert: infer Insert }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer Insert }
      ? Insert
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: SchemaName },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: SchemaName }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: SchemaName }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Update: infer Update }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer Update }
      ? Update
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: SchemaName },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: SchemaName }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: SchemaName }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: SchemaName },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: SchemaName }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: SchemaName }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
