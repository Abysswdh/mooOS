'use client';

import { useFeed } from '@/hooks/useFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { FeedOrderModal } from '@/components/features/FeedOrderModal';
import { KPICard } from '@/components/ui/KPICard';
import { DataTable, ColumnDef, SortOption } from '@/components/ui/DataTable';
import { formatNumber, formatRp } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Wheat } from 'lucide-react';
import type { FeedOrder } from '@/types';

export default function PakanPage() {
  const { stock, orders, isLoading, error, refetch } = useFeed();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const columns: ColumnDef<FeedOrder>[] = [
    { 
      header: 'No. PO', 
      accessorKey: 'po_number', 
      className: 'font-medium text-emerald-700' 
    },
    { 
      header: 'Tipe Pakan', 
      accessorKey: 'feed_type'
    },
    { 
      header: 'Jumlah (Kg)', 
      cell: (order) => formatNumber(order.quantity_kg),
      align: 'right'
    },
    { 
      header: 'Max Harga/Kg', 
      cell: (order) => formatRp(order.max_price_per_kg),
      align: 'right'
    },
    { 
      header: 'Status', 
      cell: (order) => (
        <Badge variant={order.status === 'ACCEPTED' ? 'default' : 'outline'}>{order.status}</Badge>
      ),
      align: 'center'
    },
  ];

  const sortOptions: SortOption<FeedOrder>[] = [
    { label: 'Terbaru', value: 'newest', sortFn: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() },
    { label: 'Terlama', value: 'oldest', sortFn: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() },
    { label: 'Jumlah (Terbanyak)', value: 'qty-desc', sortFn: (a, b) => b.quantity_kg - a.quantity_kg },
    { label: 'Jumlah (Sedikit)', value: 'qty-asc', sortFn: (a, b) => a.quantity_kg - b.quantity_kg },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Pakan</h2>
          <p className="text-muted-foreground">Pantau stok pakan dan kelola pemesanan (PO) ke supplier.</p>
        </div>
        <FeedOrderModal />
      </div>

      {stock && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Sisa Stok Pakan" value={`${formatNumber(stock.current_stock_kg)} kg`} icon={<Wheat className="h-4 w-4" />} />
          <KPICard title="Konsumsi Harian" value={`${formatNumber(stock.daily_consumption_kg)} kg`} icon={<Wheat className="h-4 w-4" />} />
          <KPICard 
            title="Estimasi Habis" 
            value={`${formatNumber(stock.days_remaining)} Hari`} 
            trend={stock.is_critical ? { value: 0, label: 'Kritis', isPositive: false } : undefined}
            icon={<Wheat className="h-4 w-4" />} 
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian (PO)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={orders}
            columns={columns}
            searchPlaceholder="Cari nomor PO..."
            searchKeys={['po_number', 'feed_type']}
            sortOptions={sortOptions}
            defaultSortValue="newest"
            emptyTitle="Belum ada riwayat PO"
          />
        </CardContent>
      </Card>
    </div>
  );
}
