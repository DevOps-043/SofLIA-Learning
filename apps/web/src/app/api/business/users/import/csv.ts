import type { ParsedImportUserRow } from './types'

const REQUIRED_FIELDS = ['username', 'email', 'job_title']
const HEADER_ALIASES: Record<string, string[]> = {
  job_title: ['job_title', 'cargo', 'puesto', 'rol', 'role'],
  date_of_birth: ['date_of_birth', 'fecha_nacimiento', 'birth_date', 'dob'],
  gender: ['gender', 'genero'],
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function parseImportCsvContent(fileContent: string) {
  const lines = fileContent.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    return {
      error: 'El archivo CSV debe tener al menos una fila de encabezados y una fila de datos',
    }
  }

  const headers = normalizeHeaders(parseCSVLine(lines[0]))
  const missingFields = REQUIRED_FIELDS.filter((field) => !headers.includes(field))

  if (missingFields.includes('job_title')) {
    return {
      error: 'Falta la columna requerida: "job_title" (tambien se permiten: "cargo", "puesto", "rol")',
    }
  }

  if (missingFields.length > 0) {
    return { error: `Faltan campos requeridos: ${missingFields.join(', ')}` }
  }

  return { headers, lines, total: lines.length - 1 }
}

export function buildUserDataFromCsvLine(
  headers: string[],
  line: string,
): ParsedImportUserRow {
  const values = parseCSVLine(line)
  const userData: ParsedImportUserRow = {}

  headers.forEach((header, index) => {
    userData[header] = values[index]?.trim() || ''
  })

  return userData
}

function normalizeHeaders(rawHeaders: string[]) {
  const headers = rawHeaders.map(normalizeHeader)

  for (const [normalizedHeader, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = headers.findIndex((header) => aliases.includes(header))
    if (index !== -1) headers[index] = normalizedHeader
  }

  return headers
}

function normalizeHeader(header: string) {
  return header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
