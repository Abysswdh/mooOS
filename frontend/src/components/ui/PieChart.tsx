"use client";

import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface PieData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  description?: string;
  height?: number;
  valueFormatter?: (value: any) => string;
}

// Default tailwind colors if not provided
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function PieChart({
  data,
  title,
  description,
  height = 300,
  valueFormatter,
}: PieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, payload: entryPayload } = payload[0];
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entryPayload.fill }}
            />
            <span className="text-slate-600 capitalize">{name}:</span>
            <span className="font-medium text-slate-900">
              {valueFormatter ? valueFormatter(value) : value}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      )}

      <div style={{ height: `${height}px` }} className="w-full mt-4">
        {!data || data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                  return (percent > 0.05) ? (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  ) : null;
                }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="circle" 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: "20px" }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
