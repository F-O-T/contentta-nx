"use client";

import { translate } from "@packages/localization";
import {
   type ColumnDef,
   type ColumnFiltersState,
   type ExpandedState,
   flexRender,
   getCoreRowModel,
   getExpandedRowModel,
   getFilteredRowModel,
   getSortedRowModel,
   type Row,
   type RowSelectionState,
   type SortingState,
   useReactTable,
   type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import { useIsMobile } from "../hooks/use-mobile";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Card } from "./card";
import { Checkbox } from "./checkbox";
import { Collapsible, CollapsibleContent } from "./collapsible";
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "./pagination";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "./select";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "./table";

interface DataTablePaginationProps {
   currentPage: number;
   totalPages: number;
   totalCount: number;
   pageSize: number;
   onPageChange: (page: number) => void;
   onPageSizeChange?: (size: number) => void;
   pageSizeOptions?: number[];
}

export type MobileCardRenderProps<TData> = {
   row: Row<TData>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   isSelected?: boolean;
   toggleSelected?: () => void;
   enableRowSelection?: boolean;
   canExpand?: boolean;
};

interface DataTableProps<TData, TValue> {
   columns: ColumnDef<TData, TValue>[];
   data: TData[];
   pagination?: DataTablePaginationProps;
   renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
   renderMobileCard?: (props: MobileCardRenderProps<TData>) => React.ReactNode;
   enableRowSelection?: boolean;
   rowSelection?: RowSelectionState;
   onRowSelectionChange?: (selection: RowSelectionState) => void;
   getRowId?: (row: TData) => string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

function DataTablePagination({
   currentPage,
   totalPages,
   totalCount,
   pageSize,
   onPageChange,
   onPageSizeChange,
   pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps) {
   const showingCount = Math.min(
      pageSize,
      totalCount - (currentPage - 1) * pageSize,
   );
   const isFirstPage = currentPage === 1;
   const isLastPage = currentPage === totalPages || totalPages === 0;
   const hasSinglePage = totalPages <= 1;

   const getPageNumbers = () => {
      if (totalPages <= 5) {
         return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      if (currentPage <= 3) {
         return [1, 2, 3, 4, 5];
      }
      if (currentPage >= totalPages - 2) {
         return Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
      }
      return Array.from({ length: 5 }, (_, i) => currentPage - 2 + i);
   };

   return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
         <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
               {translate(
                  "dashboard.routes.transactions.list-section.showing",
                  {
                     count: showingCount,
                     total: totalCount,
                  },
               )}
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
               {translate("dashboard.routes.transactions.list-section.page", {
                  current: currentPage,
                  total: Math.max(1, totalPages),
               })}
            </div>
         </div>
         <div className="flex items-center gap-4">
            {onPageSizeChange && (
               <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                     {translate(
                        "dashboard.routes.transactions.list-section.rows-per-page",
                     )}
                  </span>
                  <Select
                     onValueChange={(value) => onPageSizeChange(Number(value))}
                     value={String(pageSize)}
                  >
                     <SelectTrigger className="h-8 w-[70px]" size="sm">
                        <SelectValue placeholder={String(pageSize)} />
                     </SelectTrigger>
                     <SelectContent side="top">
                        {pageSizeOptions.map((size) => (
                           <SelectItem key={size} value={String(size)}>
                              {size}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            )}
            <Pagination className="w-auto">
               <PaginationContent>
                  <PaginationItem>
                     <PaginationPrevious
                        aria-disabled={isFirstPage || hasSinglePage}
                        className={cn(
                           (isFirstPage || hasSinglePage) &&
                              "pointer-events-none opacity-50",
                        )}
                        href="#"
                        onClick={(e) => {
                           e.preventDefault();
                           if (!isFirstPage && !hasSinglePage) {
                              onPageChange(currentPage - 1);
                           }
                        }}
                     />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum) => (
                     <PaginationItem key={pageNum}>
                        <PaginationLink
                           aria-disabled={hasSinglePage}
                           className={cn(
                              hasSinglePage && "pointer-events-none opacity-50",
                           )}
                           href="#"
                           isActive={pageNum === currentPage}
                           onClick={(e) => {
                              e.preventDefault();
                              if (!hasSinglePage) {
                                 onPageChange(pageNum);
                              }
                           }}
                        >
                           {pageNum}
                        </PaginationLink>
                     </PaginationItem>
                  ))}

                  <PaginationItem>
                     <PaginationNext
                        aria-disabled={isLastPage || hasSinglePage}
                        className={cn(
                           (isLastPage || hasSinglePage) &&
                              "pointer-events-none opacity-50",
                        )}
                        href="#"
                        onClick={(e) => {
                           e.preventDefault();
                           if (!isLastPage && !hasSinglePage) {
                              onPageChange(currentPage + 1);
                           }
                        }}
                     />
                  </PaginationItem>
               </PaginationContent>
            </Pagination>
         </div>
      </div>
   );
}

export function DataTable<TData, TValue>({
   columns,
   data,
   pagination,
   renderSubComponent,
   renderMobileCard,
   enableRowSelection = false,
   rowSelection: controlledRowSelection,
   onRowSelectionChange,
   getRowId,
}: DataTableProps<TData, TValue>) {
   const isMobile = useIsMobile();
   const [sorting, setSorting] = useState<SortingState>([]);
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
   const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
      {},
   );
   const [internalRowSelection, setInternalRowSelection] =
      useState<RowSelectionState>({});
   const [expanded, setExpanded] = useState<ExpandedState>({});

   const isControlled = controlledRowSelection !== undefined;
   const rowSelection = isControlled
      ? controlledRowSelection
      : internalRowSelection;

   const handleRowSelectionChange = (
      updaterOrValue:
         | RowSelectionState
         | ((old: RowSelectionState) => RowSelectionState),
   ) => {
      const newValue =
         typeof updaterOrValue === "function"
            ? updaterOrValue(rowSelection)
            : updaterOrValue;

      if (isControlled && onRowSelectionChange) {
         onRowSelectionChange(newValue);
      } else {
         setInternalRowSelection(newValue);
      }
   };

   useEffect(() => {
      if (!isControlled && onRowSelectionChange) {
         onRowSelectionChange(internalRowSelection);
      }
   }, [internalRowSelection, isControlled, onRowSelectionChange]);

   const table = useReactTable({
      columns,
      data,
      enableRowSelection,
      getCoreRowModel: getCoreRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getRowCanExpand: () => !!renderSubComponent,
      getRowId: getRowId
         ? (originalRow) => getRowId(originalRow)
         : (_row, index) => String(index),
      getSortedRowModel: getSortedRowModel(),
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onExpandedChange: setExpanded,
      onRowSelectionChange: handleRowSelectionChange,
      onSortingChange: setSorting,
      state: {
         columnFilters,
         columnVisibility,
         expanded,
         rowSelection,
         sorting,
      },
   });

   const hasSelectColumn = enableRowSelection;
   const columnCount =
      columns.length + (renderSubComponent ? 1 : 0) + (hasSelectColumn ? 1 : 0);

   if (isMobile && renderMobileCard) {
      return (
         <div className="space-y-3">
            {table.getRowModel().rows?.length ? (
               table.getRowModel().rows.map((row) => (
                  <Collapsible
                     key={row.id}
                     onOpenChange={(open) => {
                        row.toggleExpanded(open);
                     }}
                     open={row.getIsExpanded()}
                  >
                     {renderMobileCard({
                        canExpand: !!renderSubComponent,
                        enableRowSelection,
                        isExpanded: row.getIsExpanded(),
                        isSelected: row.getIsSelected(),
                        row,
                        toggleExpanded: () => row.toggleExpanded(),
                        toggleSelected: () => row.toggleSelected(),
                     })}
                     {renderSubComponent && (
                        <CollapsibleContent>
                           <Card className="rounded-t-none border-t-0">
                              {renderSubComponent({ row })}
                           </Card>
                        </CollapsibleContent>
                     )}
                  </Collapsible>
               ))
            ) : (
               <div className="py-8 text-center text-muted-foreground">
                  Nenhum resultado encontrado.
               </div>
            )}
            {pagination && <DataTablePagination {...pagination} />}
         </div>
      );
   }

   return (
      <div>
         <div className="rounded-md border">
            <Table>
               <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                     <TableRow key={headerGroup.id}>
                        {hasSelectColumn && (
                           <TableHead className="w-[40px] px-2">
                              <Checkbox
                                 aria-label="Select all"
                                 checked={
                                    table.getIsAllPageRowsSelected() ||
                                    (table.getIsSomePageRowsSelected() &&
                                       "indeterminate")
                                 }
                                 onCheckedChange={(value) =>
                                    table.toggleAllPageRowsSelected(!!value)
                                 }
                              />
                           </TableHead>
                        )}
                        {renderSubComponent && (
                           <TableHead className="w-[40px]" />
                        )}
                        {headerGroup.headers.map((header) => {
                           return (
                              <TableHead key={header.id}>
                                 {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                    <Button
                                       className="-ml-3 h-8"
                                       onClick={header.column.getToggleSortingHandler()}
                                       variant="ghost"
                                    >
                                       {flexRender(
                                          header.column.columnDef.header,
                                          header.getContext(),
                                       )}
                                       {header.column.getIsSorted() ===
                                       "asc" ? (
                                          <ArrowUp className="ml-2 size-4" />
                                       ) : header.column.getIsSorted() ===
                                         "desc" ? (
                                          <ArrowDown className="ml-2 size-4" />
                                       ) : (
                                          <ArrowUpDown className="ml-2 size-4" />
                                       )}
                                    </Button>
                                 ) : (
                                    flexRender(
                                       header.column.columnDef.header,
                                       header.getContext(),
                                    )
                                 )}
                              </TableHead>
                           );
                        })}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {table.getRowModel().rows?.length ? (
                     table.getRowModel().rows.map((row) => (
                        <Fragment key={row.id}>
                           <TableRow
                              className={cn(
                                 renderSubComponent && "cursor-pointer",
                                 row.getIsExpanded() && "bg-muted/50",
                                 row.getIsSelected() && "bg-muted/50",
                              )}
                              data-state={row.getIsSelected() && "selected"}
                              onClick={
                                 renderSubComponent
                                    ? () => row.toggleExpanded()
                                    : undefined
                              }
                           >
                              {hasSelectColumn && (
                                 <TableCell className="w-[40px] px-2">
                                    <Checkbox
                                       aria-label="Select row"
                                       checked={row.getIsSelected()}
                                       onCheckedChange={(value) =>
                                          row.toggleSelected(!!value)
                                       }
                                       onClick={(e) => e.stopPropagation()}
                                    />
                                 </TableCell>
                              )}
                              {renderSubComponent && (
                                 <TableCell className="w-[40px] px-2">
                                    <ChevronRight
                                       className={cn(
                                          "size-4 transition-transform duration-200",
                                          row.getIsExpanded() && "rotate-90",
                                       )}
                                    />
                                 </TableCell>
                              )}
                              {row.getVisibleCells().map((cell) => (
                                 <TableCell
                                    className="truncate"
                                    key={cell.id}
                                    style={{
                                       maxWidth: cell.column.columnDef.maxSize,
                                    }}
                                 >
                                    {flexRender(
                                       cell.column.columnDef.cell,
                                       cell.getContext(),
                                    )}
                                 </TableCell>
                              ))}
                           </TableRow>
                           {row.getIsExpanded() && renderSubComponent && (
                              <TableRow className="hover:bg-transparent">
                                 <TableCell
                                    className="p-0"
                                    colSpan={columnCount}
                                 >
                                    <div className="border-t bg-muted/30">
                                       {renderSubComponent({ row })}
                                    </div>
                                 </TableCell>
                              </TableRow>
                           )}
                        </Fragment>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell
                           className="h-24 text-center"
                           colSpan={columnCount}
                        >
                           Nenhum resultado encontrado.
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>
         {pagination && <DataTablePagination {...pagination} />}
      </div>
   );
}
