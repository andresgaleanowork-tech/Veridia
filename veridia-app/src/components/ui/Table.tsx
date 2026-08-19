import { useState, type ReactNode, type MouseEvent } from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableAction<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  actions?: TableAction<T>[];
  rowClassName?: (row: T) => string;
  className?: string;
  renderRow?: (row: T) => Record<string, ReactNode>;
}

function SkeletonTableRow({ columnCount }: { columnCount: number }) {
  return (
    <tr className="animate-pulse-slow">
      {Array.from({ length: columnCount }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No hay datos',
  selectable = false,
  onSelectionChange,
  actions,
  rowClassName,
  className = '',
  renderRow,
}: TableProps<T>) {
  const [sortConfig, _setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(data.map(keyExtractor));
      setSelectedKeys(allKeys);
      onSelectionChange?.(Array.from(allKeys));
    } else {
      setSelectedKeys(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (rowKey: string, checked: boolean) => {
    const newSelected = new Set(selectedKeys);
    if (checked) {
      newSelected.add(rowKey);
    } else {
      newSelected.delete(rowKey);
    }
    setSelectedKeys(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof T];
        const bVal = b[sortConfig.key as keyof T];
        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      })
    : data;

  const handleActionClick = (e: MouseEvent, action: TableAction<T>, row: T) => {
    e.stopPropagation();
    action.onClick(row);
  };

  const SortIcon = ({ direction }: { direction: 'asc' | 'desc' }) => (
    direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  );

  return (
    <div className={`overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-surface ${className} scrollbar-thin`}>
      <table className="min-w-full w-full" role="table">
        <thead>
          <tr className="bg-surface-2 border-b border-border">
            {selectable && (
              <th className="w-12 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                  checked={selectedKeys.size === data.length && data.length > 0}
                  ref={(el) => {
                    if (el) el.indeterminate = selectedKeys.size > 0 && selectedKeys.size < data.length;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-3 text-left text-xs font-semibold text-text-3 uppercase tracking-wider ${column.headerClassName || ''}`}
                aria-sort={
                  sortConfig?.key === column.key
                    ? sortConfig.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <div className="flex items-center gap-1.5">
                  <span>{column.header}</span>
                  {column.sortable && sortConfig?.key === column.key && <SortIcon direction={sortConfig.direction} />}
                </div>
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="w-12 px-3 py-3 text-right">
                <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">Acciones</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} columnCount={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} />
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                className="px-3 py-8 text-center text-text-3"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedKeys.has(rowKey);
              return (
                <tr
                  key={rowKey}
                  className={[
                    'hover:bg-white/3 transition-colors',
                    isSelected ? 'bg-primary/5' : '',
                    rowClassName?.(row),
                  ].filter(Boolean).join(' ')}
                >
                  {selectable && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(rowKey, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {renderRow ? (
                    <>
                      {Object.entries(renderRow(row)).map(([key, content]) => (
                        <td key={key} className="px-3 py-3 text-sm text-text">{content}</td>
                      ))}
                    </>
                  ) : (
                    columns.map((column) => (
                      <td key={column.key} className={`px-3 py-3 text-sm text-text ${column.className || ''}`}>
                        {column.render ? column.render(row) : (row as Record<string, unknown>)[column.key] as ReactNode}
                      </td>
                    ))
                  )}
                  {actions && actions.length > 0 && (
                    <td className="px-3 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-white/5 transition-colors"
                          aria-label="Acciones"
                          aria-haspopup="menu"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 z-10 bg-surface border border-border rounded-lg shadow-lg min-w-[140px] py-1 animate-slide-in">
                          {actions.map((action) => (
                            <button
                              key={action.label}
                              onClick={(e) => handleActionClick(e, action, row)}
                              className={[
                                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                                action.variant === 'danger' ? 'text-danger hover:bg-danger/10' : 'text-text hover:bg-white/5',
                              ].join(' ')}
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}