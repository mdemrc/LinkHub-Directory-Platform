import { ReactNode } from 'react'

interface Column<T> {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (item: T) => ReactNode
  // For mobile card view
  mobileHidden?: boolean
  mobileFullWidth?: boolean
}

interface AdminTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  // Mobile card customization
  mobileCardRender?: (item: T, columns: Column<T>[]) => ReactNode
}

export default function AdminTable<T>({ 
  columns, 
  data, 
  keyField, 
  isLoading = false,
  emptyMessage = 'No data found',
  onRowClick,
  mobileCardRender
}: AdminTableProps<T>) {
  // Default mobile card render
  const defaultMobileCard = (item: T) => {
    const visibleColumns = columns.filter(col => !col.mobileHidden && col.key !== 'actions')
    const actionsColumn = columns.find(col => col.key === 'actions')
    
    return (
      <div 
        className={`p-4 bg-lz-darker/50 border border-lz-border/30 rounded-xl space-y-3 ${onRowClick ? 'cursor-pointer' : ''}`}
        onClick={() => onRowClick?.(item)}
      >
        {visibleColumns.map((col) => (
          <div 
            key={col.key} 
            className={`${col.mobileFullWidth ? '' : 'flex items-center justify-between gap-2'}`}
          >
            {col.label && (
              <span className="text-xs text-lz-muted uppercase tracking-wide">{col.label}</span>
            )}
            <div className={col.mobileFullWidth ? 'mt-1' : ''}>
              {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
            </div>
          </div>
        ))}
        {actionsColumn && (
          <div className="pt-3 border-t border-lz-border/20 flex justify-end">
            {actionsColumn.render ? actionsColumn.render(item) : null}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-lz-darker/50 border border-lz-border/30 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lz-border/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-4 text-xs font-semibold text-lz-muted uppercase tracking-wider ${
                      col.align === 'center' ? 'text-center' : 
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-lz-border/20">
              {data.map((item) => (
                <tr 
                  key={String(item[keyField])} 
                  className={`
                    hover:bg-lz-border/10 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-4 text-sm ${
                        col.align === 'center' ? 'text-center' : 
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-lz-muted animate-pulse">Loading data...</p>
          </div>
        ) : data.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lz-muted text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="p-12 text-center bg-lz-darker/50 border border-lz-border/30 rounded-xl">
            <div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-lz-muted">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 bg-lz-darker/50 border border-lz-border/30 rounded-xl">
            <p className="text-lz-muted text-sm">{emptyMessage}</p>
          </div>
        ) : (
          data.map((item) => (
            <div key={String(item[keyField])}>
              {mobileCardRender ? mobileCardRender(item, columns) : defaultMobileCard(item)}
            </div>
          ))
        )}
      </div>
    </>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  active: boolean
  activeText?: string
  inactiveText?: string
}

export function StatusBadge({ active, activeText = 'Active', inactiveText = 'Inactive' }: StatusBadgeProps) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
      {activeText}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-500/10 text-gray-400 rounded-full">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
      {inactiveText}
    </span>
  )
}

// Action Buttons Component
interface ActionButtonsProps {
  onEdit?: () => void
  onDelete?: () => void
}

export function ActionButtons({ onEdit, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-2 rounded-lg text-lz-muted hover:text-lz-accent hover:bg-lz-accent/10 transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-lg text-lz-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
