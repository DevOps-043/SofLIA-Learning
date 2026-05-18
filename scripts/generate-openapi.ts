import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getOpenApiDocument } from '../apps/web/src/lib/openapi/document'

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(scriptDir, '..')
  const outputPath = resolve(repoRoot, 'docs/api/openapi.json')
  const document = getOpenApiDocument()

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`Failed to generate OpenAPI document: ${message}\n`)
  process.exit(1)
})
