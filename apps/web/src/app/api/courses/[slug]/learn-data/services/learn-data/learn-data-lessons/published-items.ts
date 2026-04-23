export function pickPublishedOrAll<T extends { is_published: boolean | null }>(
  items: T[],
) {
  const publishedItems = items.filter((item) => item.is_published === true)
  return publishedItems.length > 0 ? publishedItems : items
}
