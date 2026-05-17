const { formatNumber, pad, printSection } = require('./report-utils')

const GROUPS = [
  {
    title: 'TypeScript / React / Next.js',
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  },
  {
    title: 'Supabase / SQL',
    extensions: ['.sql'],
  },
  {
    title: 'Styling',
    extensions: ['.css', '.scss', '.sass', '.less'],
  },
]

function createGroupTotals(stats, extensions) {
  return extensions.reduce((totals, ext) => {
    const item = stats[ext]
    if (!item) return totals

    totals.files += item.files
    totals.total += item.total
    totals.code += item.code
    totals.blank += item.blank
    return totals
  }, { files: 0, total: 0, code: 0, blank: 0 })
}

function printGroupBreakdowns(stats) {
  for (const group of GROUPS) {
    const totals = createGroupTotals(stats, group.extensions)
    if (!totals.files) continue

    printSection(group.title)
    for (const ext of group.extensions) {
      const item = stats[ext]
      if (!item) continue

      console.log(
        `  ${pad(ext, 8)} -> ${pad(item.files, 5, 'right')} files, ${pad(formatNumber(item.total), 9, 'right')} lines (${pad(formatNumber(item.code), 9, 'right')} code)`,
      )
    }

    console.log(
      `  ${pad('Combined', 8)} -> ${pad(totals.files, 5, 'right')} files, ${pad(formatNumber(totals.total), 9, 'right')} lines (${pad(formatNumber(totals.code), 9, 'right')} code)`,
    )
  }
}

module.exports = { printGroupBreakdowns }
