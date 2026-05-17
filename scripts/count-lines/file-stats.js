const fs = require('fs')
const path = require('path')
const {
  BINARY_EXTENSIONS,
  EXCLUDED_DIRS,
  EXCLUDED_FILES,
} = require('./config')

function createTotals() {
  return { files: 0, total: 0, blank: 0, code: 0 }
}

function countLines(filePath) {
  try {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
    const blank = lines.filter((line) => line.trim() === '').length
    return { total: lines.length, blank, code: lines.length - blank }
  } catch {
    return { total: 0, blank: 0, code: 0 }
  }
}

function addFileStats(stats, filePath) {
  const ext = path.extname(filePath).toLowerCase() || '(no ext)'
  if (BINARY_EXTENSIONS.has(ext)) return

  const lines = countLines(filePath)
  stats[ext] ||= createTotals()
  stats[ext].files += 1
  stats[ext].total += lines.total
  stats[ext].blank += lines.blank
  stats[ext].code += lines.code
}

function walk(dir, stats) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, stats)
    } else if (entry.isFile() && !EXCLUDED_FILES.has(entry.name)) {
      addFileStats(stats, fullPath)
    }
  }
}

function collectStats(rootPath) {
  const stats = {}
  walk(rootPath, stats)
  return stats
}

function summarizeStats(stats) {
  return Object.values(stats).reduce((totals, item) => ({
    files: totals.files + item.files,
    total: totals.total + item.total,
    blank: totals.blank + item.blank,
    code: totals.code + item.code,
  }), createTotals())
}

module.exports = { collectStats, createTotals, summarizeStats }
