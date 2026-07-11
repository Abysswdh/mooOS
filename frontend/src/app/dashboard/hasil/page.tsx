'use client';

import { useMilk } from '@/hooks/useMilk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { MilkOfferModal } from '@/components/features/MilkOfferModal';

import { KPICard } from '@/components/ui/KPICard';
import { DataTable, ColumnDef, SortOption } from '@/components/ui/DataTable';
import { formatNumber } from '@/lib/formatters';
import { Milk, Beef } from 'lucide-react';
import type { MilkRecord } from '@/types';

export default function HasilSusuPage() {
  const { summary, records, isLoading, error, refetch } = useMilk();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const columns: ColumnDef<MilkRecord>[] = [
    { 
      header: 'Tanggal', 
      cell: (r) => new Date(r.date).toLocaleDateString('id-ID'),
    },
    { 
      header: 'ID Sapi', 
      cell: (r) => `Sapi #${r.cow_id}`,
      className: 'font-medium text-indigo-700' 
    },
    { 
      header: 'Liters', 
      cell: (r) => formatNumber(r.liters),
      align: 'right'
    },
    { 
      header: 'Dicatat Oleh', 
      cell: (r) => r.recorded_by || '-',
      className: 'text-slate-500'
    },
  ];

  const sortOptions: SortOption<MilkRecord>[] = [
    { label: 'Terbaru', value: 'newest', sortFn: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() },
    { label: 'Terlama', value: 'oldest', sortFn: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() },
    { label: 'Liter (Terbanyak)', value: 'liter-desc', sortFn: (a, b) => b.liters - a.liters },
    { label: 'Liter (Sedikit)', value: 'liter-asc', sortFn: (a, b) => a.liters - b.liters },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hasil Susu</h2>
          <p className="text-muted-foreground">Pantau produksi susu harian dari semua kandang.</p>
        </div>
          <MilkOfferModal />

      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Produksi Hari Ini" value={`${formatNumber(summary.today_total_liters)} L`} icon={<Milk className="h-4 w-4" />} />
          <KPICard title="Produksi Kemarin" value={`${formatNumber(summary.yesterday_total_liters)} L`} icon={<Milk className="h-4 w-4" />} />
          <KPICard title="Total Minggu Ini" value={`${formatNumber(summary.week_total_liters)} L`} icon={<Milk className="h-4 w-4" />} />
          <KPICard title="Sapi Laktasi" value={`${summary.active_dairy_cows} Ekor`} icon={<Beef className="h-4 w-4" />} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={records}
            columns={columns}
            searchPlaceholder="Cari pencatat..."
            searchKeys={['recorded_by']}
            sortOptions={sortOptions}
            defaultSortValue="newest"
            emptyTitle="Belum ada riwayat produksi susu"
          />
        </CardContent>
      </Card>
    </div>
  );
}
