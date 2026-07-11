'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown } from 'lucide-react';
import { useState, useMemo, ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ColumnDef<T> {
  header: ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface SortOption<T> {
  label: string;
  value: string;
  sortFn: (a: T, b: T) => number;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  // Search
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  // Sort
  sortOptions?: SortOption<T>[];
  defaultSortValue?: string;
  // Interaction
  onRowClick?: (item: T) => void;
  // States
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  searchPlaceholder = 'Cari...',
  searchKeys = [],
  sortOptions = [],
  defaultSortValue,
  onRowClick,
  isLoading,
  error,
  onRetry,
  emptyTitle = 'Belum ada data',
  emptyDescription,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState<string>(defaultSortValue || (sortOptions[0]?.value ?? ''));

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filtering
    if (searchQuery && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        return searchKeys.some((key) => {
          const val = item[key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // Sorting
    if (sortValue && sortOptions.length > 0) {
      const option = sortOptions.find((o) => o.value === sortValue);
      if (option) {
        result.sort(option.sortFn);
      }
    }

    return result;
  }, [data, searchQuery, searchKeys, sortValue, sortOptions]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={onRetry || (() => {})} />;
  
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="space-y-4">
      {/* Controls */}
      {(searchKeys.length > 0 || sortOptions.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {searchKeys.length > 0 ? (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 rounded-lg"
              />
            </div>
          ) : <div />}
          
          {sortOptions.length > 0 && (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <Select value={sortValue} onValueChange={setSortValue}>
                <SelectTrigger className="w-full sm:w-[220px] bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="Urutkan..." />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Table Data */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead 
                  key={i} 
                  className={`font-semibold text-slate-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  Tidak ada data yang cocok dengan pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((item) => (
                <TableRow 
                  key={item.id}
                  className={onRowClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((col, i) => {
                    const value = col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey] ?? '-') : null);
                    return (
                      <TableCell 
                        key={i} 
                        className={`${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
                      >
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-slate-100 text-sm text-muted-foreground bg-slate-50/50">
          Menampilkan <span className="font-medium text-slate-700">{filteredAndSortedData.length}</span> baris data.
        </div>
      </div>
    </div>
  );
}
