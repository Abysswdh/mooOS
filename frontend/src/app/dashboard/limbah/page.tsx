'use client';

import { useWaste } from '@/hooks/useWaste';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { WasteCreateModal } from '@/components/features/WasteCreateModal';
import { FertilizerOfferModal } from '@/components/features/FertilizerOfferModal';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, ColumnDef, SortOption } from '@/components/ui/DataTable';
import { formatNumber } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Recycle } from 'lucide-react';
import type { WasteBatch } from '@/types';

export default function LimbahPage() {
  const { summary, batches, isLoading, error, refetch } = useWaste();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const columns: ColumnDef<WasteBatch>[] = [
    { 
      header: 'Kode Batch', 
      accessorKey: 'batch_code', 
      className: 'font-medium text-emerald-700' 
    },
    { 
      header: 'Kandang ID', 
      cell: (b) => `#${b.barn_id}`,
      className: 'text-slate-500' 
    },
    { 
      header: 'Limbah Mentah (kg)', 
      cell: (b) => formatNumber(b.raw_waste_kg),
      align: 'right'
    },
    { 
      header: 'Estimasi Pupuk (kg)', 
      cell: (b) => formatNumber(b.estimated_fertilizer_kg),
      align: 'right'
    },
    { 
      header: 'Status', 
      cell: (b) => (
        <Badge variant={b.status === 'READY' ? 'default' : 'outline'}>{b.status}</Badge>
      ),
      align: 'center'
    },
  ];

  const sortOptions: SortOption<WasteBatch>[] = [
    { label: 'Terbaru', value: 'newest', sortFn: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
    { label: 'Terlama', value: 'oldest', sortFn: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
    { label: 'Limbah (Terbanyak)', value: 'waste-desc', sortFn: (a, b) => b.raw_waste_kg - a.raw_waste_kg },
    { label: 'Limbah (Sedikit)', value: 'waste-asc', sortFn: (a, b) => a.raw_waste_kg - b.raw_waste_kg },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pengolahan Limbah & Pupuk</h2>
          <p className="text-muted-foreground">Pantau proses fermentasi pupuk kandang.</p>
        </div>
        <div className="flex gap-2">
          <FertilizerOfferModal />
          <WasteCreateModal />
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Limbah Mentah" value={`${formatNumber(summary.total_raw_waste_kg)} kg`} icon={<Recycle className="h-4 w-4" />} />
          <KPICard title="Pupuk Siap Jual" value={`${formatNumber(summary.total_fertilizer_ready_kg)} kg`} icon={<Recycle className="h-4 w-4" />} />
          <KPICard title="Batch Fermentasi" value={`${summary.batches_fermenting} Batch`} icon={<Recycle className="h-4 w-4" />} />
          <KPICard title="Batch Siap Jual" value={`${summary.batches_ready} Batch`} icon={<Recycle className="h-4 w-4" />} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Batch Pupuk</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={batches}
            columns={columns}
            searchPlaceholder="Cari kode batch..."
            searchKeys={['batch_code']}
            sortOptions={sortOptions}
            defaultSortValue="newest"
            emptyTitle="Belum ada data batch limbah"
          />
        </CardContent>
      </Card>
    </div>
  );
}
