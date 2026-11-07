"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField?: keyof T | string;
  isLoading?: boolean;
  error?: string | null;
  searchPlaceholder?: string;
  searchField?: (row: T) => string;
  filterField?: (row: T) => string;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  pageSize?: number;
  bulkActions?: {
    label: string;
    action: (selectedRows: T[]) => void;
    variant?: "default" | "destructive" | "outline";
  }[];
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField = "id",
  isLoading = false,
  error = null,
  searchPlaceholder = "Search records...",
  searchField,
  filterField,
  filterOptions,
  filterPlaceholder = "Filter by status",
  pageSize = 10,
  bulkActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filtering & Search
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Filter dropdown check
      if (filter !== "all" && filterField) {
        if (filterField(row) !== filter) return false;
      }
      // Search input check
      if (search.trim()) {
        const query = search.toLowerCase();
        if (searchField) {
          if (!searchField(row).toLowerCase().includes(query)) return false;
        } else {
          const textValues = Object.values(row)
            .filter((val) => typeof val === "string" || typeof val === "number")
            .join(" ")
            .toLowerCase();
          if (!textValues.includes(query)) return false;
        }
      }
      return true;
    });
  }, [data, filter, filterField, search, searchField]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Selection handlers
  const getItemKey = (row: T): string => {
    return String(row[keyField as string] || row._id || row.id);
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(getItemKey(row)));

  const toggleSelectAll = () => {
    const newSelected = new Set(selectedIds);
    if (isAllSelected) {
      paginatedData.forEach((row) => newSelected.delete(getItemKey(row)));
    } else {
      paginatedData.forEach((row) => newSelected.add(getItemKey(row)));
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectRow = (key: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) newSelected.delete(key);
    else newSelected.add(key);
    setSelectedIds(newSelected);
  };

  const selectedRows = useMemo(() => {
    return data.filter((row) => selectedIds.has(getItemKey(row)));
  }, [data, selectedIds]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filter, Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ioma-grey-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          {filterOptions && filterOptions.length > 0 && (
            <Select
              value={filter}
              onValueChange={(v) => {
                setFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filterPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Bulk Action Buttons */}
        {bulkActions && bulkActions.length > 0 && selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ioma-grey-500 font-medium">
              {selectedIds.size} selected
            </span>
            {bulkActions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={action.variant || "outline"}
                onClick={() => action.action(selectedRows)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-ioma-grey-50">
            <TableRow>
              {bulkActions && (
                <TableHead className="w-[40px] pl-4">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 font-medium hover:text-ioma-black transition-colors"
                    >
                      {col.header}
                      <ArrowUpDown className="h-3.5 w-3.5 text-ioma-grey-400" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 1. Loading State */}
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <TableRow key={idx}>
                  {bulkActions && (
                    <TableCell className="pl-4">
                      <div className="h-4 w-4 bg-ioma-grey-100 animate-pulse rounded" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <div className="h-4 w-24 bg-ioma-grey-100 animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              /* 2. Error State */
              <TableRow>
                <TableCell
                  colSpan={columns.length + (bulkActions ? 1 : 0)}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-rose-600 gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="font-medium text-sm">{error}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              /* 3. Empty State */
              <TableRow>
                <TableCell
                  colSpan={columns.length + (bulkActions ? 1 : 0)}
                  className="h-48 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-ioma-grey-400 gap-2">
                    <Inbox className="h-8 w-8 stroke-1" />
                    <p className="text-sm font-medium">No records found</p>
                    <p className="text-xs text-ioma-grey-500">
                      Try adjusting your filters or search terms.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              /* 4. Data State */
              paginatedData.map((row) => {
                const key = getItemKey(row);
                const isSelected = selectedIds.has(key);
                return (
                  <TableRow
                    key={key}
                    className={isSelected ? "bg-ioma-grey-50" : undefined}
                  >
                    {bulkActions && (
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.cell ? col.cell(row) : String(row[col.key] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !error && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-ioma-grey-500">
          <div>
            Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}{" "}
            entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="font-medium text-ioma-black px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
