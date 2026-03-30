#!/usr/bin/env node
// Removes standalone console.log statements (active and commented-out) from production source files.
const fs = require('fs')
const path = require('path')
const files = process.argv.slice(2)

function removeConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const result = []
  let i = 0, removed = 0

  while (i < lines.length) {
    const line = lines[i]

    // Match active console.log( OR commented-out // console.log(
    if (/^\s*(\/\/)?\s*console\.log\(/.test(line)) {
      // Count open vs close parens to find where this statement ends
      // Strip comment prefix before counting parens
      let depth = 0, j = i, found = false

      while (j < lines.length) {
        const scanLine = lines[j].replace(/^\s*\/\/\s*/, '')  // strip leading //
        for (const ch of scanLine) {
          if (ch === '(') depth++
          else if (ch === ')') { depth--; if (depth === 0) { found = true; break } }
        }
        if (found) break
        j++
      }

      if (found) { removed += (j - i + 1); i = j + 1 }
      else { result.push(line); i++ }
    } else { result.push(line); i++ }
  }

  if (removed > 0) fs.writeFileSync(filePath, result.join('\n'), 'utf8')
  return removed
}

let total = 0
for (const f of files) {
  const abs = path.resolve(f)
  if (!fs.existsSync(abs)) { console.error('NOT FOUND: ' + f); continue }
  const n = removeConsoleLogs(abs)
  if (n > 0) console.log(path.basename(f) + ': removed ' + n)
  total += n
}
console.log('--- Total removed: ' + total)
