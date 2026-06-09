export function addUniqueNoteTag(tags: string[], rawTag: string): string[] {
  const normalizedTag = rawTag.trim()

  if (!normalizedTag || tags.includes(normalizedTag)) {
    return tags
  }

  return [...tags, normalizedTag]
}

export function removeNoteTag(tags: string[], tagToRemove: string): string[] {
  return tags.filter((tag) => tag !== tagToRemove)
}

/**
 * Indica si la nota tiene contenido "real" (texto visible).
 *
 * El contenido del editor es HTML (`contentEditable`), por lo que medir
 * `content.length` daría falsos positivos: al enfocar el editor o pulsar Enter
 * el navegador inserta marcado vacío (`<br>`, `<div><br></div>`, `&nbsp;`) que
 * no es texto. Esos casos pasaban la validación del cliente pero el servidor los
 * rechazaba (422, "contenido requerido"), provocando guardados fallidos.
 * Aquí eliminamos el marcado y los espacios no separables antes de comprobar.
 */
export function hasNoteContent(content: string): boolean {
  const plainText = content
    .replace(/<[^>]*>/g, '') // elimina etiquetas HTML
    .replace(/&nbsp;/gi, ' ') // los espacios no separables cuentan como vacío
    .trim()

  return plainText.length > 0
}
