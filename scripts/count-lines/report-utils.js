function pad(value, length, align = 'left') {
  const text = String(value)
  return align === 'right' ? text.padStart(length) : text.padEnd(length)
}

function formatNumber(value) {
  return value.toLocaleString()
}

function percentage(part, total) {
  return total > 0 ? ((part / total) * 100).toFixed(1) : '0.0'
}

function printSection(title) {
  console.log('')
  console.log(`== ${title} ==`)
}

function sortStatsEntries(stats) {
  return Object.entries(stats).sort((a, b) => b[1].total - a[1].total)
}

module.exports = {
  formatNumber,
  pad,
  percentage,
  printSection,
  sortStatsEntries,
}
