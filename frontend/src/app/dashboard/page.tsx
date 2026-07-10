'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useSettings } from '@/hooks/useSettings';
import { KPICard } from '@/components/ui/KPICard';
import { AbsensiCard } from '@/components/features/AbsensiCard';
import { ChecklistPanel } from '@/components/features/ChecklistPanel';
import { StaticChecklist } from '@/components/features/StaticChecklist';
import { formatNumber, formatRp } from '@/lib/formatters';
import { Beef, Droplets, Wheat, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { summary, isLoading, error } = useDashboard();
  const { settings } = useSettings();

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
        {/* Left Column: Profile & Attendance */}
        <div className="lg:col-span-3 h-full">
          <AbsensiCard />
        </div>
        
        {/* Middle Column: Routine Tasks (Static) */}
        <div className="lg:col-span-5 h-full">
          <StaticChecklist />
        </div>

        {/* Right Column: System Alerts (Dynamic MRP) */}
        <div className="lg:col-span-4 h-full">
          <ChecklistPanel />
        </div>
      </div>

      {/* Bottom Row: KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0 pb-2">
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
    </div>
  );
}
