import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export interface ResponsiveDataTableColumn<T> {
  id: string
  header: ReactNode
  cell: (item: T, index: number) => ReactNode
  mobileLabel?: ReactNode
  mobileValue?: (item: T, index: number) => ReactNode
  mobileHidden?: boolean
  mobileOrder?: number
  thClassName?: string
  tdClassName?: string
}

interface ResponsiveDataTableProps<T> {
  data: T[]
  columns: ResponsiveDataTableColumn<T>[]
  keyExtractor: (item: T, index: number) => string
  emptyState?: ReactNode
  className?: string
  tableClassName?: string
  tableWrapperClassName?: string
  mobileListClassName?: string
  mobileCardClassName?: string
  tableMinWidthClassName?: string
  renderMobileCard?: (item: T, index: number) => ReactNode
}

export function ResponsiveDataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  className,
  tableClassName,
  tableWrapperClassName,
  mobileListClassName,
  mobileCardClassName,
  tableMinWidthClassName,
  renderMobileCard,
}: ResponsiveDataTableProps<T>) {
  const mobileColumns = [...columns]
    .filter((column) => !column.mobileHidden)
    .sort((left, right) => (left.mobileOrder ?? 0) - (right.mobileOrder ?? 0))

  if (data.length === 0) {
    return <>{emptyState ?? null}</>
  }

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div className={cn('hidden md:block', tableWrapperClassName)}>
        <div className="overflow-x-auto">
          <table
            className={cn(
              'w-full min-w-full border-collapse',
              tableMinWidthClassName,
              tableClassName,
            )}
          >
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn('text-left align-middle', column.thClassName)}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={keyExtractor(item, index)}>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn('align-middle', column.tdClassName)}
                    >
                      {column.cell(item, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cn('space-y-3 md:hidden', mobileListClassName)}>
        {data.map((item, index) => {
          const itemKey = keyExtractor(item, index)

          if (renderMobileCard) {
            return <div key={itemKey}>{renderMobileCard(item, index)}</div>
          }

          return (
            <div
              key={itemKey}
              className={cn(
                'rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]',
                mobileCardClassName,
              )}
            >
              <dl className="space-y-3">
                {mobileColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <dt className="min-w-0 text-xs font-semibold uppercase tracking-wide text-[#6C757D] dark:text-white/60">
                      {column.mobileLabel ?? column.header}
                    </dt>
                    <dd className="min-w-0 flex-1 text-right text-sm text-[#0A2540] dark:text-white">
                      {column.mobileValue
                        ? column.mobileValue(item, index)
                        : column.cell(item, index)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>
    </div>
  )
}
