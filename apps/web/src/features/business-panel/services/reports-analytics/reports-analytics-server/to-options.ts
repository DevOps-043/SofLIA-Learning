export function toOptions(values: Map<string, string>): Array<{ value: string; label: string }> {
  return Array.from(values.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
