import { ReactNode } from 'react'

type Column<T> = {
  key: string
  label: string
  className?: string
  render: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyLabel?: string
  tableClassName?: string
  mobileCardRender?: (row: T) => ReactNode
  mobileCardClassName?: string
}

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyLabel = 'No rows.',
  tableClassName,
  mobileCardRender,
  mobileCardClassName,
}: DataTableProps<T>) {
  return (
    <>
      {mobileCardRender ? (
        <div className="grid gap-3 md:hidden">
          {rows.length ? (
            rows.map((row) => (
              <div
                key={getRowKey(row)}
                className={mobileCardClassName || 'rounded-2xl border border-white/10 bg-white/[0.03] p-4'}
              >
                {mobileCardRender(row)}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">
              {emptyLabel}
            </div>
          )}
        </div>
      ) : null}

      <div className={mobileCardRender ? 'hidden md:block' : 'block'}>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className={`min-w-full border-collapse text-sm ${tableClassName || ''}`}>
            <thead className="bg-white/5">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                {columns.map((column) => (
                  <th key={column.key} className={`px-3 py-3 ${column.className || ''}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={getRowKey(row)} className="border-t border-white/5 text-slate-200 hover:bg-white/[0.03]">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-3 py-3 align-top ${column.className || ''}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-400" colSpan={columns.length}>
                    {emptyLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
