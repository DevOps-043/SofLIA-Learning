'use client'

import type { ReactNode } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BusinessPanelSearchInput } from './shared/BusinessPanelSearchInput'

interface ReportTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  className?: string
}

export function ReportTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  className = '',
}: ReportTableProps<T>) {
  const panelTheme = useBusinessPanelTheme()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <BusinessPanelSearchInput
          value={globalFilter ?? ''}
          onChange={setGlobalFilter}
          placeholder={searchPlaceholder}
        />
      )}

      <div
        className="rounded-[28px] border overflow-hidden"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: panelTheme.borderColor,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  style={{
                    backgroundColor: panelTheme.hoverBg,
                    borderBottom: `1px solid ${panelTheme.dividerColor}`,
                  }}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] select-none"
                      style={{ color: panelTheme.mutedTextColor }}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="inline-flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="inline-flex flex-col -space-y-1">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5" style={{ color: panelTheme.actionColor }} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-3.5 h-3.5" style={{ color: panelTheme.actionColor }} />
                            ) : (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" style={{ color: panelTheme.mutedTextColor }} />
                                <ChevronDown className="w-3.5 h-3.5" style={{ color: panelTheme.mutedTextColor }} />
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm"
                    style={{ color: panelTheme.subtextColor }}
                  >
                    No hay datos para mostrar
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      borderBottom: `1px solid ${panelTheme.borderColor}`,
                      backgroundColor: row.index % 2 === 0 ? 'transparent' : panelTheme.hoverBg,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm"
                        style={{ color: panelTheme.textColor }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{
              backgroundColor: panelTheme.hoverBg,
              borderTop: `1px solid ${panelTheme.dividerColor}`,
            }}
          >
            <div className="text-sm" style={{ color: panelTheme.subtextColor }}>
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} ({table.getFilteredRowModel().rows.length} resultados)
            </div>

            <div className="flex items-center gap-2">
              <PaginationButton
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                panelTheme={panelTheme}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              <PaginationButton
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                panelTheme={panelTheme}
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PaginationButton({
  disabled,
  onClick,
  panelTheme,
  icon,
}: {
  disabled: boolean
  onClick: () => void
  panelTheme: ReturnType<typeof useBusinessPanelTheme>
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-xl border disabled:opacity-45 disabled:cursor-not-allowed"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: panelTheme.borderColor,
        color: panelTheme.textColor,
      }}
    >
      {icon}
    </button>
  )
}
