'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { KPICard } from '@/components/ui/KPICard';
import { AbsensiCard } from '@/components/features/AbsensiCard';
import { ChecklistPanel } from '@/components/features/ChecklistPanel';
import { formatNumber, formatRp } from '@/lib/formatters';
import { Beef, Droplets, Wheat, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { summary, isLoading, error } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Top Row: KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Sapi Aktif"
          value={formatNumber(summary?.active_cows || 0)}
          icon={<Beef className="h-4 w-4" />}
          description="Sapi Sehat & Sakit"
          isLoading={isLoading}
          error={error}
        />
        <KPICard
          title="Produksi Susu Hari Ini"
          value={`${formatNumber(summary?.today_milk_liters || 0)} L`}
          icon={<Droplets className="h-4 w-4" />}
          description="Total dari semua kandang"
          isLoading={isLoading}
          error={error}
        />
        <KPICard
          title="Stok Pakan"
          value={`${formatNumber(summary?.feed_stock_kg || 0)} kg`}
          icon={<Wheat className="h-4 w-4" />}
          description="Perkiraan habis dalam bbrp hari"
          isLoading={isLoading}
          error={error}
        />
        <KPICard
          title="Estimasi Pendapatan"
          value={summary ? formatRp(summary.today_revenue) : "Rp0"}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Hari ini (Kotor)"
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Middle Row: Main Features */}
      <div className="grid gap-6 md:grid-cols-12 h-full">
        <div className="md:col-span-8 h-[500px]">
          <ChecklistPanel />
        </div>
        <div className="md:col-span-4 h-[500px]">
          <AbsensiCard />
        </div>
      </div>
    </div>
  );
}
