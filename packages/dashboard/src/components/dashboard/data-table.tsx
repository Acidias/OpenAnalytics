"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function DataTable<T extends Record<string, unknown>>({ columns, data }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.accessorKey)} className={col.className}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i}>
            {columns.map((col) => (
              <TableCell key={String(col.accessorKey)} className={col.className}>
                {col.cell ? col.cell(row[col.accessorKey], row) : String(row[col.accessorKey] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
