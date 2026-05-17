const {
  formatNumber,
  pad,
  percentage,
  printSection,
  sortStatsEntries,
} = require('./report-utils')

const HIGHLIGHT_EXTENSIONS = new Set([
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.css',
  '.html',
  '.json',
  '.md',
  '.sql',
  '.mjs',
])

function printExtensionTable(stats, totals) {
  printSection('Lines by extension')
  console.log(`  ${pad('Extension', 14)} ${pad('Files', 10, 'right')} ${pad('Total', 10, 'right')} ${pad('Code', 10, 'right')} ${pad('Blank', 10, 'right')}`)
  console.log(`  ${'-'.repeat(60)}`)

  for (const [ext, item] of sortStatsEntries(stats)) {
    const marker = HIGHLIGHT_EXTENSIONS.has(ext) ? '>' : ' '
    console.log(
      `  ${pad(`${marker} ${ext}`, 14)} ${pad(formatNumber(item.files), 10, 'right')} ${pad(formatNumber(item.total), 10, 'right')} ${pad(formatNumber(item.code), 10, 'right')} ${pad(formatNumber(item.blank), 10, 'right')} (${percentage(item.total, totals.total)}%)`,
    )
  }

  console.log(`  ${'-'.repeat(60)}`)
  console.log(`  ${pad('TOTAL', 14)} ${pad(formatNumber(totals.files), 10, 'right')} ${pad(formatNumber(totals.total), 10, 'right')} ${pad(formatNumber(totals.code), 10, 'right')} ${pad(formatNumber(totals.blank), 10, 'right')}`)
}

function printTopExtensions(stats, totals, limit = 5) {
  printSection(`Top ${limit} extensions`)
  const topEntries = sortStatsEntries(stats).slice(0, limit)
  const maxLines = topEntries[0]?.[1].total || 1

  for (const [ext, item] of topEntries) {
    const barLength = Math.round((item.total / maxLines) * 32)
    const bar = '#'.repeat(barLength).padEnd(32, '.')
    console.log(
      `  ${pad(ext, 10)} ${bar} ${pad(formatNumber(item.total), 10, 'right')} lines (${percentage(item.total, totals.total)}%)`,
    )
  }
}

module.exports = { printExtensionTable, printTopExtensions }
