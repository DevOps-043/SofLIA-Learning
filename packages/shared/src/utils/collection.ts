export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const groupBy = <T, K extends PropertyKey>(
  array: T[],
  getKey: (item: T) => K,
): Record<K, T[]> => {
  return array.reduce(
    (groups, item) => {
      const key = getKey(item)
      groups[key] ??= []
      groups[key].push(item)
      return groups
    },
    {} as Record<K, T[]>,
  )
}

export const sortBy = <T>(
  array: T[],
  getSortKey: (item: T) => string | number,
  order: 'asc' | 'desc' = 'asc',
): T[] => {
  return [...array].sort((left, right) => {
    const leftKey = getSortKey(left)
    const rightKey = getSortKey(right)
    return order === 'asc'
      ? compareAscending(leftKey, rightKey)
      : compareAscending(rightKey, leftKey)
  })
}

function compareAscending(left: string | number, right: string | number) {
  if (left === right) return 0
  return left > right ? 1 : -1
}
