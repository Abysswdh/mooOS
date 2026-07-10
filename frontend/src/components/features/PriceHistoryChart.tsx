"use client";

import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { LineChart, LineConfig } from "@/components/ui/LineChart";

export interface MarketPrice {
  id: number;
  date: string;
  item_type: "PAKAN" | "SUSU" | "PUPUK";
  price_per_unit: number;
  unit: string;
}

interface PriceHistoryChartProps {
  data: MarketPrice[];
  title?: string;
  description?: string;
}

export function PriceHistoryChart({
  data,
  title = "Histori Harga Pasar",
  description = "Pergerakan harga pakan, susu, dan pupuk (per kg/liter)",
}: PriceHistoryChartProps) {
  // Transform data for the LineChart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const groupedByDate: Record<string, { date: string; pakan: number | null; susu: number | null; pupuk: number | null; originalDate: string }> = {};

    data.forEach((item) => {
      if (!groupedByDate[item.date]) {
        groupedByDate[item.date] = {
          date: format(parseISO(item.date), "dd MMM", { locale: id }),
          originalDate: item.date,
          pakan: null,
          susu: null,
          pupuk: null,
        };
      }
      
      const price = Number(item.price_per_unit);
      
      if (item.item_type === "PAKAN") groupedByDate[item.date].pakan = price;
      if (item.item_type === "SUSU") groupedByDate[item.date].susu = price;
      if (item.item_type === "PUPUK") groupedByDate[item.date].pupuk = price;
    });

    // Sort by date ascending
    return Object.values(groupedByDate).sort((a, b) => 
      new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime()
    );
  }, [data]);

  const lines: LineConfig[] = [
    { key: "susu", name: "Susu (liter)", color: "#3b82f6" },
    { key: "pakan", name: "Pakan (kg)", color: "#f59e0b" },
    { key: "pupuk", name: "Pupuk (kg)", color: "#10b981" },
  ];

  const yAxisFormatter = (value: number) => `Rp${value / 1000}k`;
  
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <LineChart
      data={chartData}
      xAxisKey="date"
      lines={lines}
      title={title}
      description={description}
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={formatRupiah}
    />
  );
}

