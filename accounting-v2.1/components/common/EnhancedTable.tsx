import React, { useState, useMemo, ReactNode } from 'react';
import DateRangePicker from './DateRangePicker';
import TagManager from './TagManager';

// Icons
const SortIcon = () => <svg className="w-4 h-4 inline-block text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>;
const SortUpIcon = () => <svg className="w-4 h-4 inline-block text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const SortDownIcon = () => <svg className="w-4 h-4 inline-block text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} role="img" aria-label="آیکون تگ"><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;


export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  sortKey?: keyof T | string;
  searchable?: boolean; // defaults to true for accessor if it's a keyof T
}

interface EnhancedTableProps<T extends { id: number | string, tags?: string[] }> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T) => ReactNode;
  tableName: string;
  entityType?: string;
  enableDateFilter?: boolean;
  dateFilterKey?: keyof T;
}

export const EnhancedTable = <T extends { id: number | string, tags?: string[] }>({
  columns,
  data,
  actions,
  tableName,
  entityType,
  enableDateFilter,
  dateFilterKey,
}: EnhancedTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' } | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [taggedEntity, setTaggedEntity] = useState<T | null>(null);
  const tableId = useMemo(() => `table-${tableName}-${Math.random().toString(36).substring(2, 9)}`, [tableName]);

  const handleOpenTagManager = (item: T) => {
    setTaggedEntity(item);
    setIsTagManagerOpen(true);
  };
  
  const handleCloseTagManager = () => {
    setTaggedEntity(null);
    setIsTagManagerOpen(false);
  }

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Date range filtering
    if (enableDateFilter && dateFilterKey && dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = item[dateFilterKey] as string;
        if (!itemDate) return false;
        return itemDate >= dateRange.start && itemDate <= dateRange.end;
      });
    }

    // Search term filtering
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        // Also search in tags if they exist
        if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))) {
            return true;
        }
        return columns.some(column => {
          if (column.searchable === false) return false;
          let value: any;
          if (typeof column.accessor === 'function') {
            const rendered = column.accessor(item);
            if (typeof rendered === 'string' || typeof rendered === 'number') {
              value = String(rendered);
            } else {
              return false;
            }
          } else {
            value = item[column.accessor as keyof T];
          }
          return String(value).toLowerCase().includes(lowercasedTerm);
        });
      });
    }

    return filtered;
  }, [data, searchTerm, columns, dateRange, enableDateFilter, dateFilterKey]);
  
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      
      if (aValue === undefined || bValue === undefined) return 0;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const requestSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const renderSortIcon = (key: keyof T | string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <SortIcon />;
    }
    return sortConfig.direction === 'asc' ? <SortUpIcon /> : <SortDownIcon />;
  };
  
  const handleDateChange = (range: { start: string; end: string }) => {
      setDateRange(range);
  };
  
  const handlePrint = () => {
    (window as any).printContent(tableId, tableName);
  }

  const downloadCSV = () => {
    const header = columns.map(c => c.header).join(',');
    const rows = sortedData.map(row => {
        return columns.map(col => {
            let value;
            if(typeof col.accessor === 'function'){
                const res = col.accessor(row);
                if(res && typeof res === 'object' && 'props' in res) {
                  value = React.Children.toArray((res.props as any).children).join('');
                } else if(typeof res === 'object') {
                  value = JSON.stringify(res);
                }
                else value = String(res);
            } else {
                value = row[col.accessor as keyof T];
            }
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${header}\n${rows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tableName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-sm">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="جستجو (شامل تگ‌ها)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-input w-full sm:w-auto"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {enableDateFilter && <DateRangePicker onRangeChange={handleDateChange} />}
          <button onClick={handlePrint} className="btn btn-secondary">چاپ</button>
          <button onClick={downloadCSV} className="btn btn-secondary">CSV</button>
        </div>
      </div>
      <div id={tableId} className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-primary)] responsive-table printable-table">
          <thead className="bg-[var(--bg-tertiary)]">
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.header)}
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider"
                >
                  {column.sortKey ? (
                    <button
                      className="flex items-center gap-1"
                      onClick={() => requestSort(column.sortKey!)}
                    >
                      {column.header}
                      {renderSortIcon(column.sortKey!)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {(actions || entityType) && <th scope="col" className="relative px-6 py-3 print-hidden"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-primary)]">
            {sortedData.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]">
                {columns.map((column, index) => (
                  <td key={`${String(column.header)}-${index}`} className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]" data-label={column.header}>
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : String(item[column.accessor as keyof T] ?? '')}
                  </td>
                ))}
                {(actions || entityType) && (
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium print-hidden" data-label="عملیات">
                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                        {entityType && (
                            <button onClick={() => handleOpenTagManager(item)} className="btn btn-sm btn-icon btn-secondary" title="مدیریت تگ‌ها">
                                <TagIcon />
                            </button>
                        )}
                        {actions && actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {sortedData.length === 0 && (
            <p className="text-center text-[var(--text-secondary)] py-8">موردی برای نمایش یافت نشد.</p>
        )}
      </div>
      {taggedEntity && entityType && (
        <TagManager
            isOpen={isTagManagerOpen}
            onClose={handleCloseTagManager}
            entityType={entityType}
            entityId={taggedEntity.id}
            currentTags={taggedEntity.tags || []}
        />
      )}
    </div>
  );
};