export function buildBusinessAssignCoursePayload(params: {
  selectedUserIds: Set<string>
  dueDate: string
}): {
  user_ids: string[]
  due_date: string | null
  start_date: null
  approach: null
  message: null
} {
  return {
    user_ids: Array.from(params.selectedUserIds),
    due_date: params.dueDate || null,
    start_date: null,
    approach: null,
    message: null,
  }
}
