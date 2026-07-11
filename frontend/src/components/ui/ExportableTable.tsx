"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
  render?: (value: any, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface ExportableTableProps<T> {
  title: string;
  description?: string;
  columns: ColumnDef<T>[];
  data: T[];
  exportFileName?: string;
}

export function ExportableTable<T>({
  title,
  description,
  columns,
  data,
  exportFileName = "table-export.pdf",
}: ExportableTableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExporting(true);

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // Better resolution
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(exportFileName);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCellContent = (row: T, column: ColumnDef<T>) => {
    const value =
      typeof column.accessor === "function"
        ? column.accessor(row)
        : row[column.accessor as keyof T];

    if (column.render) {
      return column.render(value, row);
    }
    return value;
  };

  return (
    <div className="w-full flex flex-col space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        <Button 
          onClick={handleExportPDF} 
          disabled={isExporting || !data || data.length === 0}
          variant="outline"
          className="shrink-0"
        >
          <Printer className="mr-2 h-4 w-4" />
          {isExporting ? "Menyiapkan PDF..." : "Export as PDF"}
        </Button>
      </div>

      <div className="mt-4" ref={tableRef}>
        {/* We add a print-only header so the PDF looks nice if the user wants to print the element directly */}
        <div className="hidden print:block mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {description && <p className="text-slate-500 mt-1">{description}</p>}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 font-medium ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!data || data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada data
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-4 py-3 ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {getCellContent(row, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
