const fs = require('fs')
const { collectStats, createTotals, summarizeStats } = require('./file-stats')
const {
  formatNumber,
  pad,
  percentage,
  printSection,
} = require('./report-utils')

function getWorkspaceRows(workspaces) {
  return workspaces
    .map((workspace) => {
      const stats = fs.existsSync(workspace.path)
        ? collectStats(workspace.path)
        : {}

      return {
        name: workspace.name,
        ...summarizeStats(stats),
      }
    })
    .sort((a, b) => b.total - a.total)
}

function summarizeRows(rows) {
  return rows.reduce((totals, row) => ({
    files: totals.files + row.files,
    total: totals.total + row.total,
    blank: totals.blank + row.blank,
    code: totals.code + row.code,
  }), createTotals())
}

function printWorkspaceReport(workspaces) {
  const rows = getWorkspaceRows(workspaces)
  const totals = summarizeRows(rows)

  printSection('Workspace breakdown')
  console.log(`  ${pad('Workspace', 20)} ${pad('Files', 10, 'right')} ${pad('Total', 10, 'right')} ${pad('Code', 10, 'right')} ${pad('Blank', 10, 'right')}`)
  console.log(`  ${'-'.repeat(70)}`)

  for (const row of rows) {
    console.log(
      `  ${pad(row.name, 20)} ${pad(formatNumber(row.files), 10, 'right')} ${pad(formatNumber(row.total), 10, 'right')} ${pad(formatNumber(row.code), 10, 'right')} ${pad(formatNumber(row.blank), 10, 'right')} (${percentage(row.total, totals.total)}%)`,
    )
  }

  console.log(`  ${'-'.repeat(70)}`)
  console.log(`  ${pad('TOTAL', 20)} ${pad(formatNumber(totals.files), 10, 'right')} ${pad(formatNumber(totals.total), 10, 'right')} ${pad(formatNumber(totals.code), 10, 'right')} ${pad(formatNumber(totals.blank), 10, 'right')}`)
}

module.exports = { printWorkspaceReport }
